import { IntegrationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const isMock = process.env.APCRDA_MOCK_MODE !== 'false';

export interface AcquisitionAward {
  surveyNumber: string;
  village: string;
  mandal: string;
  district: string;
  areaSqYds: number;
  awardNumber: string;
  awardDate: string;
}

export interface LandRecordBond {
  tdrNumber: string;
  holderName: string;
  surveyNumber: string;
  areaSqYds: number;
  ratio: string;
  status: string;
}

export interface GisParcel {
  surveyNumber: string;
  village: string;
  mandal: string;
  district: string;
  areaSqYds: number;
  coordinates?: { lat: number; lng: number };
}

export interface Village {
  villageCode: string;
  villageName: string;
  mandal: string;
  district: string;
}

export interface FarmerKyc {
  farmerId: string;
  name: string;
  aadhaarHash: string;
  phone: string;
  kycVerified: boolean;
}

export interface PrefillData {
  acquisition?: AcquisitionAward | null;
  landRecord?: LandRecordBond | null;
  gis?: GisParcel | null;
  farmer?: FarmerKyc | null;
}

let tokenCache: { token: string; expiresAt: number } | null = null;
let failureCount = 0;
let circuitOpenUntil = 0;

async function getOAuthToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const tokenUrl = process.env.APCRDA_OAUTH_TOKEN_URL;
  const clientId = process.env.APCRDA_CLIENT_ID;
  const clientSecret = process.env.APCRDA_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new IntegrationError('APCRDA OAuth', 500, 'OAuth credentials not configured');
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new IntegrationError('APCRDA OAuth', response.status, 'Token request failed');
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };
  return data.access_token;
}

async function apcrdaFetch<T>(url: string, retries = 3): Promise<T | null> {
  if (Date.now() < circuitOpenUntil) {
    throw new IntegrationError('APCRDA', 503, 'Circuit breaker open');
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const token = await getOAuthToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 21600 },
      });

      if (response.status === 401 && attempt === 0) {
        tokenCache = null;
        continue;
      }

      if (response.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new IntegrationError('APCRDA', response.status, response.statusText);
      }

      failureCount = 0;
      return (await response.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  failureCount++;
  if (failureCount >= 5) {
    circuitOpenUntil = Date.now() + 60000;
  }

  throw lastError ?? new IntegrationError('APCRDA', 502, 'Request failed after retries');
}

async function landDetailFromSurvey(surveyNo: string) {
  return prisma.bondLandDetail.findFirst({
    where: { surveyNumber: surveyNo },
    include: { bond: { include: { holder: true } } },
  });
}

export async function verifyAcquisitionAward(surveyNo: string): Promise<AcquisitionAward | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: verifyAcquisitionAward (database)');
    const land = await landDetailFromSurvey(surveyNo);
    if (!land) return null;

    const village = await prisma.village.findFirst({
      where: { villageName: land.surrenderedVillage },
    });

    return {
      surveyNumber: land.surveyNumber,
      village: land.surrenderedVillage,
      mandal: village?.mandal ?? 'Penamaluru',
      district: village?.district ?? 'KRISHNA',
      areaSqYds: Number(land.surrenderedAreaSqYds),
      awardNumber: `AWD-${land.surveyNumber.replace(/\//g, '-')}`,
      awardDate: land.bond.createdAt.toISOString().slice(0, 10),
    };
  }
  const baseUrl = process.env.APCRDA_LAND_RECORDS_URL;
  return apcrdaFetch<AcquisitionAward>(`${baseUrl}/awards/${encodeURIComponent(surveyNo)}`);
}

export async function getBondByTdrNumber(tdrNo: string): Promise<LandRecordBond | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getBondByTdrNumber (database)');
    const bond = await prisma.tdrBond.findUnique({
      where: { tdrNumber: tdrNo },
      include: { holder: true, landDetails: true },
    });
    if (!bond?.landDetails) return null;

    return {
      tdrNumber: bond.tdrNumber,
      holderName: bond.holder?.name ?? '',
      surveyNumber: bond.landDetails.surveyNumber,
      areaSqYds: Number(bond.landDetails.tdrIssuedExtentSqYds),
      ratio: bond.landDetails.issuedRatio,
      status: bond.status,
    };
  }
  const baseUrl = process.env.APCRDA_LAND_RECORDS_URL;
  return apcrdaFetch<LandRecordBond>(`${baseUrl}/bonds/${encodeURIComponent(tdrNo)}`);
}

export async function getGisParcel(surveyNo: string): Promise<GisParcel | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getGisParcel (database)');
    const land = await landDetailFromSurvey(surveyNo);
    if (!land) return null;

    const village = await prisma.village.findFirst({
      where: { villageName: land.surrenderedVillage },
    });

    return {
      surveyNumber: land.surveyNumber,
      village: land.surrenderedVillage,
      mandal: village?.mandal ?? 'Penamaluru',
      district: village?.district ?? 'KRISHNA',
      areaSqYds: Number(land.surrenderedAreaSqYds),
    };
  }
  const baseUrl = process.env.APCRDA_GIS_URL;
  return apcrdaFetch<GisParcel>(`${baseUrl}/parcels/${encodeURIComponent(surveyNo)}`);
}

export async function getVillageMasterList(districtCode?: string): Promise<Village[]> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getVillageMasterList (database)');
    const rows = await prisma.village.findMany({
      where: districtCode ? { district: districtCode } : undefined,
      orderBy: { villageName: 'asc' },
    });
    return rows.map((v) => ({
      villageCode: v.gisCode,
      villageName: v.villageName,
      mandal: v.mandal,
      district: v.district,
    }));
  }
  const baseUrl = process.env.APCRDA_GIS_URL;
  const url = districtCode
    ? `${baseUrl}/villages?district=${encodeURIComponent(districtCode)}`
    : `${baseUrl}/villages`;
  return (await apcrdaFetch<Village[]>(url)) ?? [];
}

export async function getFarmerKyc(farmerId: string): Promise<FarmerKyc | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getFarmerKyc (database)');
    const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
    if (!farmer) return null;

    return {
      farmerId: farmer.id,
      name: farmer.name,
      aadhaarHash: farmer.aadhaarHash,
      phone: farmer.aadhaarPhone,
      kycVerified: farmer.kycVerified,
    };
  }
  const baseUrl = process.env.APCRDA_FARMER_URL;
  return apcrdaFetch<FarmerKyc>(`${baseUrl}/farmers/${encodeURIComponent(farmerId)}`);
}

export async function composePrefillData(
  surveyNo: string,
  tdrNo?: string,
  farmerId?: string,
): Promise<PrefillData> {
  const [acquisition, landRecord, gis, farmer] = await Promise.all([
    verifyAcquisitionAward(surveyNo),
    tdrNo ? getBondByTdrNumber(tdrNo) : Promise.resolve(null),
    getGisParcel(surveyNo),
    farmerId ? getFarmerKyc(farmerId) : Promise.resolve(null),
  ]);
  return { acquisition, landRecord, gis, farmer };
}
