import { IntegrationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import landRecordsFixture from './fixtures/land-records-award.json';
import gisParcelFixture from './fixtures/gis-parcel.json';
import farmerKycFixture from './fixtures/farmer-kyc.json';

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

export async function verifyAcquisitionAward(surveyNo: string): Promise<AcquisitionAward | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: verifyAcquisitionAward');
    return { ...landRecordsFixture, surveyNumber: surveyNo } as AcquisitionAward;
  }
  const baseUrl = process.env.APCRDA_LAND_RECORDS_URL;
  return apcrdaFetch<AcquisitionAward>(`${baseUrl}/awards/${encodeURIComponent(surveyNo)}`);
}

export async function getBondByTdrNumber(tdrNo: string): Promise<LandRecordBond | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getBondByTdrNumber');
    return { ...landRecordsFixture, tdrNumber: tdrNo } as unknown as LandRecordBond;
  }
  const baseUrl = process.env.APCRDA_LAND_RECORDS_URL;
  return apcrdaFetch<LandRecordBond>(`${baseUrl}/bonds/${encodeURIComponent(tdrNo)}`);
}

export async function getGisParcel(surveyNo: string): Promise<GisParcel | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getGisParcel');
    return { ...gisParcelFixture, surveyNumber: surveyNo } as GisParcel;
  }
  const baseUrl = process.env.APCRDA_GIS_URL;
  return apcrdaFetch<GisParcel>(`${baseUrl}/parcels/${encodeURIComponent(surveyNo)}`);
}

export async function getVillageMasterList(districtCode?: string): Promise<Village[]> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getVillageMasterList');
    const villages = [
      { villageCode: 'KR001', villageName: 'Kanuru', mandal: 'Penamaluru', district: 'KRISHNA' },
      {
        villageCode: 'KR002',
        villageName: 'Udandarayunipaalem',
        mandal: 'Penamaluru',
        district: 'KRISHNA',
      },
      { villageCode: 'KR003', villageName: 'Neerukonda', mandal: 'Thullur', district: 'KRISHNA' },
    ];
    return districtCode ? villages.filter((v) => v.district === districtCode) : villages;
  }
  const baseUrl = process.env.APCRDA_GIS_URL;
  const url = districtCode
    ? `${baseUrl}/villages?district=${encodeURIComponent(districtCode)}`
    : `${baseUrl}/villages`;
  return (await apcrdaFetch<Village[]>(url)) ?? [];
}

export async function getFarmerKyc(farmerId: string): Promise<FarmerKyc | null> {
  if (isMock) {
    logger.warn('APCRDA mock mode: getFarmerKyc');
    return { ...farmerKycFixture, farmerId } as FarmerKyc;
  }
  const baseUrl = process.env.APCRDA_FARMER_URL;
  return apcrdaFetch<FarmerKyc>(`${baseUrl}/farmers/${encodeURIComponent(farmerId)}`);
}

export async function composePrefillData(surveyNo: string, tdrNo?: string): Promise<PrefillData> {
  const [acquisition, landRecord, gis, farmer] = await Promise.all([
    verifyAcquisitionAward(surveyNo),
    tdrNo ? getBondByTdrNumber(tdrNo) : Promise.resolve(null),
    getGisParcel(surveyNo),
    getFarmerKyc('default'),
  ]);
  return { acquisition, landRecord, gis, farmer };
}
