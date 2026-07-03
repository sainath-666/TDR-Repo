import {
  PrismaClient,
  BondStatus,
  OfficialRole,
  ApprovalDecision,
  RelationType,
  type DocumentType,
} from '@prisma/client';
import { createHash } from 'crypto';
import { encryptAadhaar, hashAadhaar } from '@/lib/security/hmac';

const prisma = new PrismaClient();
const GENESIS_HASH = 'APCRDA-TDR-GENESIS-2026';

const DOCUMENT_TYPES: DocumentType[] = [
  'OWNERSHIP_DOCUMENT',
  'AADHAAR_COPY',
  'RETURNABLE_PLOT_ALLOTMENT',
  'TDR_ISSUED_COPY',
  'INDIVIDUAL_SKETCH',
];

function chainHash(prev: string, payload: object): string {
  return createHash('sha256')
    .update(`${prev}:${JSON.stringify(payload)}`)
    .digest('hex');
}

async function clearAllData() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.approvalStep.deleteMany(),
    prisma.bondDocument.deleteMany(),
    prisma.bondHolder.deleteMany(),
    prisma.bondLandDetail.deleteMany(),
    prisma.tdrBond.deleteMany(),
    prisma.otpRequest.deleteMany(),
    prisma.idempotencyCache.deleteMany(),
    prisma.farmer.deleteMany(),
    prisma.official.deleteMany(),
    prisma.village.deleteMany(),
  ]);
}

interface DraftBondSeed {
  tdrNumber: string;
  farmerId: string;
  farmerName: string;
  aadhaar: string;
  phone: string;
  email: string;
  relationType: RelationType;
  relationName: string;
  doorNo: string;
  street: string;
  village: string;
  mandal: string;
  district: string;
  surveyNumber: string;
  ownershipDeedNo: string;
  surrenderedAreaSqYds: number;
  tdrIssuedExtentSqYds: number;
  issuedRatio: string;
  tdrCertificateNumber: string;
}

const DRAFT_BONDS: DraftBondSeed[] = [
  {
    tdrNumber: 'TDR-2025-001',
    farmerId: '22222222-2222-2222-2222-222222222201',
    farmerName: 'Sri Venkata Rao',
    aadhaar: '999999999999',
    phone: '9999999999',
    email: 'venkata.rao@example.com',
    relationType: RelationType.S_O,
    relationName: 'Rama Rao',
    doorNo: '12-34',
    street: 'Main Road',
    village: 'Kanuru',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '12/1A',
    ownershipDeedNo: 'DEED-2024-4521',
    surrenderedAreaSqYds: 880,
    tdrIssuedExtentSqYds: 880,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-001',
  },
  {
    tdrNumber: 'TDR-2025-002',
    farmerId: '22222222-2222-2222-2222-222222222202',
    farmerName: 'Smt. Lakshmi Devi',
    aadhaar: '888888888888',
    phone: '9888888888',
    email: 'lakshmi.devi@example.com',
    relationType: RelationType.W_O,
    relationName: 'Srinivas Rao',
    doorNo: '5-67',
    street: 'Gandhi Nagar',
    village: 'Poranki',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '45/2B',
    ownershipDeedNo: 'DEED-2024-3890',
    surrenderedAreaSqYds: 1200,
    tdrIssuedExtentSqYds: 1200,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-002',
  },
  {
    tdrNumber: 'TDR-2025-003',
    farmerId: '22222222-2222-2222-2222-222222222203',
    farmerName: 'Sri Ramesh Babu',
    aadhaar: '777777777777',
    phone: '9777777777',
    email: 'ramesh.babu@example.com',
    relationType: RelationType.S_O,
    relationName: 'Venkateswara Rao',
    doorNo: '8-12',
    street: 'Benz Circle Road',
    village: 'Tadigadapa',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '78/3',
    ownershipDeedNo: 'DEED-2024-5102',
    surrenderedAreaSqYds: 650,
    tdrIssuedExtentSqYds: 650,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-003',
  },
  {
    tdrNumber: 'TDR-2025-004',
    farmerId: '22222222-2222-2222-2222-222222222204',
    farmerName: 'Smt. Padmavathi',
    aadhaar: '666666666666',
    phone: '9666666666',
    email: 'padmavathi.k@example.com',
    relationType: RelationType.D_O,
    relationName: 'Krishna Murthy',
    doorNo: '3-89',
    street: 'Ring Road',
    village: 'Nunna',
    mandal: 'Vijayawada Rural',
    district: 'KRISHNA',
    surveyNumber: '102/4A',
    ownershipDeedNo: 'DEED-2024-6210',
    surrenderedAreaSqYds: 1500,
    tdrIssuedExtentSqYds: 1500,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-004',
  },
  {
    tdrNumber: 'TDR-2025-005',
    farmerId: '22222222-2222-2222-2222-222222222205',
    farmerName: 'Sri Suresh Kumar',
    aadhaar: '555555555555',
    phone: '9555555555',
    email: 'suresh.kumar@example.com',
    relationType: RelationType.S_O,
    relationName: 'Narayana Rao',
    doorNo: '15-22',
    street: 'NH-16 Service Road',
    village: 'Gannavaram',
    mandal: 'Gannavaram',
    district: 'KRISHNA',
    surveyNumber: '56/1C',
    ownershipDeedNo: 'DEED-2024-7345',
    surrenderedAreaSqYds: 920,
    tdrIssuedExtentSqYds: 920,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-005',
  },
  {
    tdrNumber: 'TDR-2025-006',
    farmerId: '22222222-2222-2222-2222-222222222206',
    farmerName: 'Sri Anil Kumar',
    aadhaar: '444444444444',
    phone: '9444444444',
    email: 'anil.kumar@example.com',
    relationType: RelationType.S_O,
    relationName: 'Satyanarayana',
    doorNo: '7-45',
    street: 'Mangalagiri Road',
    village: 'Ramavarappadu',
    mandal: 'Vijayawada Rural',
    district: 'KRISHNA',
    surveyNumber: '33/2D',
    ownershipDeedNo: 'DEED-2024-8123',
    surrenderedAreaSqYds: 1100,
    tdrIssuedExtentSqYds: 1100,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-006',
  },
];

async function main() {
  console.log('Clearing all data...');
  await clearAllData();

  const officialIds = {
    deo: '11111111-1111-1111-1111-111111111101',
    tah: '11111111-1111-1111-1111-111111111102',
    sdc: '11111111-1111-1111-1111-111111111103',
    dir: '11111111-1111-1111-1111-111111111104',
    com: '11111111-1111-1111-1111-111111111105',
  };

  await prisma.$transaction(async (tx) => {
    await tx.village.createMany({
      data: [
        { gisCode: 'KR-KAN-001', villageName: 'Kanuru', mandal: 'Penamaluru', district: 'KRISHNA' },
        {
          gisCode: 'KR-POR-001',
          villageName: 'Poranki',
          mandal: 'Penamaluru',
          district: 'KRISHNA',
        },
        {
          gisCode: 'KR-TAD-001',
          villageName: 'Tadigadapa',
          mandal: 'Penamaluru',
          district: 'KRISHNA',
        },
        {
          gisCode: 'KR-NUN-001',
          villageName: 'Nunna',
          mandal: 'Vijayawada Rural',
          district: 'KRISHNA',
        },
        {
          gisCode: 'KR-GAN-001',
          villageName: 'Gannavaram',
          mandal: 'Gannavaram',
          district: 'KRISHNA',
        },
        {
          gisCode: 'KR-RAM-001',
          villageName: 'Ramavarappadu',
          mandal: 'Vijayawada Rural',
          district: 'KRISHNA',
        },
      ],
    });

    await tx.official.createMany({
      data: [
        {
          id: officialIds.deo,
          employeeId: 'DEO001',
          name: 'Sri K. Raju',
          role: OfficialRole.DEO,
          districtCode: 'KRISHNA',
          phone: '9000000001',
        },
        {
          id: officialIds.tah,
          employeeId: 'TAH001',
          name: 'Sri P. Reddy',
          role: OfficialRole.DY_TAHSILDAR,
          districtCode: 'KRISHNA',
          phone: '9000000002',
        },
        {
          id: officialIds.sdc,
          employeeId: 'SDC001',
          name: 'Sri M. Rao',
          role: OfficialRole.SDC,
          districtCode: 'KRISHNA',
          phone: '9000000003',
        },
        {
          id: officialIds.dir,
          employeeId: 'DIR001',
          name: 'Sri V. Sharma',
          role: OfficialRole.DIRECTOR_LANDS,
          districtCode: 'ALL',
          phone: '9000000004',
        },
        {
          id: officialIds.com,
          employeeId: 'COM001',
          name: 'Sri K. Venkateswara Rao',
          role: OfficialRole.COMMISSIONER,
          districtCode: 'ALL',
          phone: '9000000005',
        },
      ],
    });

    for (const seed of DRAFT_BONDS) {
      const aadhaarHash = hashAadhaar(seed.aadhaar);

      await tx.farmer.create({
        data: {
          id: seed.farmerId,
          name: seed.farmerName,
          aadhaarHash,
          aadhaarPhone: seed.phone,
          kycVerified: true,
        },
      });

      const bond = await tx.tdrBond.create({
        data: {
          tdrNumber: seed.tdrNumber,
          status: BondStatus.DRAFT,
          farmerId: seed.farmerId,
          holder: {
            create: {
              name: seed.farmerName,
              relationType: seed.relationType,
              relationName: seed.relationName,
              aadhaarHash,
              aadhaarEncrypted: encryptAadhaar(seed.aadhaar),
              aadhaarPhone: seed.phone,
              email: seed.email,
              doorNo: seed.doorNo,
              street: seed.street,
              village: seed.village,
              mandal: seed.mandal,
              district: seed.district,
            },
          },
          landDetails: {
            create: {
              surrenderedVillage: seed.village,
              surveyNumber: seed.surveyNumber,
              surrenderedAreaSqYds: seed.surrenderedAreaSqYds,
              tdrIssuedExtentSqYds: seed.tdrIssuedExtentSqYds,
              issuedRatio: seed.issuedRatio,
              ownershipDeedNo: seed.ownershipDeedNo,
              tdrCertificateNumber: seed.tdrCertificateNumber,
            },
          },
          documents: {
            create: DOCUMENT_TYPES.map((docType) => ({
              docType,
              ipfsCid: `bafy${seed.tdrNumber.replace(/-/g, '')}${docType.slice(0, 4)}`,
              supabaseStoragePath: `bonds/${seed.tdrNumber}/${docType}.pdf`,
              sha256Hash: createHash('sha256').update(`${seed.tdrNumber}:${docType}`).digest('hex'),
              fileName: `${docType}.pdf`,
              fileSizeKb: 100 + DOCUMENT_TYPES.indexOf(docType) * 12,
              uploadedBy: officialIds.deo,
            })),
          },
          approvalSteps: {
            create: [
              { level: 1, role: OfficialRole.DY_TAHSILDAR, decision: ApprovalDecision.PENDING },
              { level: 2, role: OfficialRole.SDC, decision: ApprovalDecision.PENDING },
              { level: 3, role: OfficialRole.DIRECTOR_LANDS, decision: ApprovalDecision.PENDING },
              { level: 4, role: OfficialRole.COMMISSIONER, decision: ApprovalDecision.PENDING },
            ],
          },
        },
      });

      const payload = {
        bondId: bond.id,
        action: 'BOND_SEED_DRAFT',
        tdrNumber: seed.tdrNumber,
        timestamp: new Date().toISOString(),
      };

      await tx.auditLog.create({
        data: {
          bondId: bond.id,
          action: 'BOND_SEED_DRAFT',
          chainHash: chainHash(GENESIS_HASH, payload),
          details: payload,
        },
      });
    }

    console.log(`Created ${DRAFT_BONDS.length} bonds awaiting DEO review:`);
    DRAFT_BONDS.forEach((b) => console.log(`  · ${b.tdrNumber} — ${b.farmerName}`));
    console.log('Officials: 5 · Farmers: 6 · Villages: 6');
  });

  console.log('Approval logins (5):');
  console.log('  1. DEO001      — Data Entry Operator / Surveyor');
  console.log('  2. TAH001      — Deputy Tahsildar / Tahsildar');
  console.log('  3. SDC001      — SDC');
  console.log('  4. DIR001      — Director (Lands)');
  console.log('  5. COM001      — Additional Commissioner / Commissioner');
  console.log('Seed complete. Run: npm run auth:sync');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
