/**
 * Append DRAFT bond applications without wiping existing data.
 * Usage: npm run db:seed:append
 */
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

const APPEND_BONDS = [
  {
    tdrNumber: 'TDR-2025-011',
    farmerId: '22222222-2222-2222-2222-222222222211',
    farmerName: 'Sri Rajesh Kumar',
    aadhaar: '121212121212',
    phone: '9000000011',
    email: 'rajesh.kumar@example.com',
    relationType: RelationType.S_O,
    relationName: 'Venkata Rao',
    doorNo: '6-14',
    street: 'Kanuru High Road',
    village: 'Kanuru',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '14/2A',
    ownershipDeedNo: 'DEED-2024-9501',
    surrenderedAreaSqYds: 760,
    tdrIssuedExtentSqYds: 760,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-011',
  },
  {
    tdrNumber: 'TDR-2025-012',
    farmerId: '22222222-2222-2222-2222-222222222212',
    farmerName: 'Smt. Kavitha Reddy',
    aadhaar: '131313131313',
    phone: '9000000012',
    email: 'kavitha.reddy@example.com',
    relationType: RelationType.W_O,
    relationName: 'Ravi Kumar',
    doorNo: '3-27',
    street: 'Poranki Extension',
    village: 'Poranki',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '52/3',
    ownershipDeedNo: 'DEED-2024-9512',
    surrenderedAreaSqYds: 890,
    tdrIssuedExtentSqYds: 890,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-012',
  },
  {
    tdrNumber: 'TDR-2025-013',
    farmerId: '22222222-2222-2222-2222-222222222213',
    farmerName: 'Sri Srinivas Murthy',
    aadhaar: '141414141414',
    phone: '9000000013',
    email: 'srinivas.murthy@example.com',
    relationType: RelationType.S_O,
    relationName: 'Nageswara Rao',
    doorNo: '10-8',
    street: 'Tadigadapa Road',
    village: 'Tadigadapa',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '91/4',
    ownershipDeedNo: 'DEED-2024-9523',
    surrenderedAreaSqYds: 1020,
    tdrIssuedExtentSqYds: 1020,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-013',
  },
  {
    tdrNumber: 'TDR-2025-014',
    farmerId: '22222222-2222-2222-2222-222222222214',
    farmerName: 'Smt. Anuradha Devi',
    aadhaar: '151515151515',
    phone: '9000000014',
    email: 'anuradha.devi@example.com',
    relationType: RelationType.D_O,
    relationName: 'Suryanarayana',
    doorNo: '1-55',
    street: 'Nunna Village Road',
    village: 'Nunna',
    mandal: 'Vijayawada Rural',
    district: 'KRISHNA',
    surveyNumber: '108/7',
    ownershipDeedNo: 'DEED-2024-9534',
    surrenderedAreaSqYds: 1150,
    tdrIssuedExtentSqYds: 1150,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-014',
  },
  {
    tdrNumber: 'TDR-2025-015',
    farmerId: '22222222-2222-2222-2222-222222222215',
    farmerName: 'Sri Praveen Kumar',
    aadhaar: '161616161616',
    phone: '9000000015',
    email: 'praveen.kumar@example.com',
    relationType: RelationType.S_O,
    relationName: 'Mallikarjuna Rao',
    doorNo: '18-3',
    street: 'Gannavaram Main Street',
    village: 'Gannavaram',
    mandal: 'Gannavaram',
    district: 'KRISHNA',
    surveyNumber: '63/1B',
    ownershipDeedNo: 'DEED-2024-9545',
    surrenderedAreaSqYds: 940,
    tdrIssuedExtentSqYds: 940,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-015',
  },
  {
    tdrNumber: 'TDR-2025-016',
    farmerId: '22222222-2222-2222-2222-222222222216',
    farmerName: 'Sri Vijay Kumar',
    aadhaar: '171717171717',
    phone: '9000000016',
    email: 'vijay.kumar@example.com',
    relationType: RelationType.S_O,
    relationName: 'Ramakrishna',
    doorNo: '5-41',
    street: 'Ramavarappadu Road',
    village: 'Ramavarappadu',
    mandal: 'Vijayawada Rural',
    district: 'KRISHNA',
    surveyNumber: '37/5',
    ownershipDeedNo: 'DEED-2024-9556',
    surrenderedAreaSqYds: 870,
    tdrIssuedExtentSqYds: 870,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-016',
  },
  {
    tdrNumber: 'TDR-2025-017',
    farmerId: '22222222-2222-2222-2222-222222222217',
    farmerName: 'Smt. Radha Devi',
    aadhaar: '181818181818',
    phone: '9000000017',
    email: 'radha.devi@example.com',
    relationType: RelationType.W_O,
    relationName: 'Sekhar Babu',
    doorNo: '8-19',
    street: 'Kanuru Layout',
    village: 'Kanuru',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '22/6',
    ownershipDeedNo: 'DEED-2024-9567',
    surrenderedAreaSqYds: 720,
    tdrIssuedExtentSqYds: 720,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-017',
  },
  {
    tdrNumber: 'TDR-2025-018',
    farmerId: '22222222-2222-2222-2222-222222222218',
    farmerName: 'Sri Ganesh Babu',
    aadhaar: '191919191919',
    phone: '9000000018',
    email: 'ganesh.babu@example.com',
    relationType: RelationType.S_O,
    relationName: 'Sambasiva Rao',
    doorNo: '12-6',
    street: 'Poranki Ring Road',
    village: 'Poranki',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '49/9',
    ownershipDeedNo: 'DEED-2024-9578',
    surrenderedAreaSqYds: 990,
    tdrIssuedExtentSqYds: 990,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-018',
  },
  {
    tdrNumber: 'TDR-2025-019',
    farmerId: '22222222-2222-2222-2222-222222222219',
    farmerName: 'Smt. Lalitha Kumari',
    aadhaar: '202020202020',
    phone: '9000000019',
    email: 'lalitha.kumari@example.com',
    relationType: RelationType.D_O,
    relationName: 'Govind Rao',
    doorNo: '2-33',
    street: 'Tadigadapa Main',
    village: 'Tadigadapa',
    mandal: 'Penamaluru',
    district: 'KRISHNA',
    surveyNumber: '85/2',
    ownershipDeedNo: 'DEED-2024-9589',
    surrenderedAreaSqYds: 810,
    tdrIssuedExtentSqYds: 810,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-019',
  },
  {
    tdrNumber: 'TDR-2025-020',
    farmerId: '22222222-2222-2222-2222-222222222220',
    farmerName: 'Sri Naveen Chandra',
    aadhaar: '212121212121',
    phone: '9000000020',
    email: 'naveen.chandra@example.com',
    relationType: RelationType.S_O,
    relationName: 'Chandra Sekhar',
    doorNo: '7-88',
    street: 'Nunna Bypass',
    village: 'Nunna',
    mandal: 'Vijayawada Rural',
    district: 'KRISHNA',
    surveyNumber: '115/3',
    ownershipDeedNo: 'DEED-2024-9600',
    surrenderedAreaSqYds: 1280,
    tdrIssuedExtentSqYds: 1280,
    issuedRatio: '1:1',
    tdrCertificateNumber: 'TDR-CERT-2025-020',
  },
] as const;

async function main() {
  const deo = await prisma.official.findUnique({
    where: { employeeId: 'DEO001' },
    select: { id: true },
  });

  if (!deo) {
    console.error('ERROR: DEO001 not found. Run npm run db:seed first.');
    process.exit(1);
  }

  const existing = await prisma.tdrBond.findMany({
    where: { tdrNumber: { in: APPEND_BONDS.map((b) => b.tdrNumber) } },
    select: { tdrNumber: true },
  });

  if (existing.length > 0) {
    console.error('ERROR: These bonds already exist:', existing.map((b) => b.tdrNumber).join(', '));
    process.exit(1);
  }

  const lastAudit = await prisma.auditLog.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  let auditId = (lastAudit?.id ?? 0n) + 1n;

  await prisma.$transaction(async (tx) => {
    for (const seed of APPEND_BONDS) {
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
              uploadedBy: deo.id,
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
          id: auditId,
          bondId: bond.id,
          action: 'BOND_SEED_DRAFT',
          chainHash: chainHash(GENESIS_HASH, payload),
          details: payload,
        },
      });

      auditId += 1n;
    }
  });

  const total = await prisma.tdrBond.count({ where: { status: BondStatus.DRAFT } });
  console.log(`Added ${APPEND_BONDS.length} bonds (DRAFT). Total DRAFT bonds: ${total}`);
  APPEND_BONDS.forEach((b) => console.log(`  · ${b.tdrNumber} — ${b.farmerName}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
