import {
  PrismaClient,
  BondStatus,
  OfficialRole,
  ApprovalDecision,
  RelationType,
} from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const GENESIS_HASH = 'APCRDA-TDR-GENESIS-2026';

function chainHash(prev: string, payload: object): string {
  return createHash('sha256')
    .update(`${prev}:${JSON.stringify(payload)}`)
    .digest('hex');
}

async function clearSeedData() {
  await prisma.auditLog.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.bondDocument.deleteMany();
  await prisma.bondHolder.deleteMany();
  await prisma.bondLandDetail.deleteMany();
  await prisma.tdrBond.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.official.deleteMany();
  await prisma.village.deleteMany();
}

async function main() {
  console.log('Clearing existing seed data...');
  await clearSeedData();

  const officialIds = {
    deo: '11111111-1111-1111-1111-111111111101',
    tah: '11111111-1111-1111-1111-111111111102',
    sdc: '11111111-1111-1111-1111-111111111103',
    dir: '11111111-1111-1111-1111-111111111104',
    com: '11111111-1111-1111-1111-111111111105',
    sur: '11111111-1111-1111-1111-111111111106',
  };

  const farmerIds = {
    f1: '22222222-2222-2222-2222-222222222201',
    f2: '22222222-2222-2222-2222-222222222202',
    f3: '22222222-2222-2222-2222-222222222203',
    f4: '22222222-2222-2222-2222-222222222204',
  };

  const aadhaarHash = createHash('sha256').update('999999999999').digest('hex');

  const villages = [
    { gisCode: 'KR-KAN-001', villageName: 'Kanuru', mandal: 'Penamaluru', district: 'KRISHNA' },
    {
      gisCode: 'KR-UDA-002',
      villageName: 'Udandarayunipaalem',
      mandal: 'Penamaluru',
      district: 'KRISHNA',
    },
    { gisCode: 'KR-NEE-003', villageName: 'Neerukonda', mandal: 'Thullur', district: 'KRISHNA' },
    {
      gisCode: 'KR-MAN-004',
      villageName: 'Mangalagiri',
      mandal: 'Mangalagiri',
      district: 'KRISHNA',
    },
    { gisCode: 'KR-TUL-005', villageName: 'Tullur', mandal: 'Tullur', district: 'KRISHNA' },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.village.createMany({ data: villages });

    const officials = await Promise.all([
      tx.official.create({
        data: {
          id: officialIds.deo,
          employeeId: 'DEO001',
          name: 'Sri K. Raju',
          role: OfficialRole.DEO,
          districtCode: 'KRISHNA',
          phone: '9000000001',
        },
      }),
      tx.official.create({
        data: {
          id: officialIds.tah,
          employeeId: 'TAH001',
          name: 'Sri P. Reddy',
          role: OfficialRole.DY_TAHSILDAR,
          districtCode: 'KRISHNA',
          phone: '9000000002',
        },
      }),
      tx.official.create({
        data: {
          id: officialIds.sdc,
          employeeId: 'SDC001',
          name: 'Sri M. Rao',
          role: OfficialRole.SDC,
          districtCode: 'KRISHNA',
          phone: '9000000003',
        },
      }),
      tx.official.create({
        data: {
          id: officialIds.dir,
          employeeId: 'DIR001',
          name: 'Sri V. Sharma',
          role: OfficialRole.DIRECTOR_LANDS,
          districtCode: 'ALL',
          phone: '9000000004',
        },
      }),
      tx.official.create({
        data: {
          id: officialIds.com,
          employeeId: 'COM001',
          name: 'Sri K. Venkateswara Rao',
          role: OfficialRole.COMMISSIONER,
          districtCode: 'ALL',
          phone: '9000000005',
        },
      }),
      tx.official.create({
        data: {
          id: officialIds.sur,
          employeeId: 'SUR001',
          name: 'Sri N. Kumar',
          role: OfficialRole.SURVEYOR,
          districtCode: 'KRISHNA',
          phone: '9000000006',
        },
      }),
    ]);

    const farmers = await Promise.all([
      tx.farmer.create({
        data: {
          id: farmerIds.f1,
          name: 'Sri Venkata Rao',
          aadhaarHash,
          aadhaarPhone: '9999999999',
          kycVerified: true,
        },
      }),
      tx.farmer.create({
        data: {
          id: farmerIds.f2,
          name: 'Sri Rama Devi',
          aadhaarHash,
          aadhaarPhone: '9999999998',
          kycVerified: true,
        },
      }),
      tx.farmer.create({
        data: {
          id: farmerIds.f3,
          name: 'Sri Krishna Murthy',
          aadhaarHash,
          aadhaarPhone: '9999999997',
          kycVerified: true,
        },
      }),
      tx.farmer.create({
        data: {
          id: farmerIds.f4,
          name: 'Smt. Lakshmi Devi',
          aadhaarHash,
          aadhaarPhone: '9999999996',
          kycVerified: false,
        },
      }),
    ]);

    console.log(
      'Created officials:',
      officials.length,
      'farmers:',
      farmers.length,
      'villages:',
      villages.length,
    );

    const approvalStepsTemplate = [
      { level: 1, role: OfficialRole.DY_TAHSILDAR },
      { level: 2, role: OfficialRole.SDC },
      { level: 3, role: OfficialRole.DIRECTOR_LANDS },
      { level: 4, role: OfficialRole.COMMISSIONER },
    ];

    const holderBase = (name: string, phone: string, village: string, mandal: string) => ({
      name,
      relationType: RelationType.S_O,
      relationName: 'Rama Rao',
      aadhaarHash,
      aadhaarEncrypted: 'ENCRYPTED_PLACEHOLDER',
      aadhaarPhone: phone,
      doorNo: '12-34',
      street: 'Main Road',
      village,
      mandal,
      district: 'KRISHNA',
    });

    const bondA = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-001',
        status: BondStatus.DRAFT,
        farmerId: farmerIds.f1,
        createdBy: officialIds.deo,
        holder: { create: holderBase('Sri Venkata Rao', '9999999999', 'Kanuru', 'Penamaluru') },
        approvalSteps: {
          create: approvalStepsTemplate.map((s) => ({
            level: s.level,
            role: s.role,
            decision: ApprovalDecision.PENDING,
          })),
        },
      },
    });

    const bondB = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-002',
        status: BondStatus.PENDING_L2,
        farmerId: farmerIds.f2,
        createdBy: officialIds.deo,
        holder: {
          create: {
            ...holderBase('Sri Rama Devi', '9999999998', 'Udandarayunipaalem', 'Penamaluru'),
            relationType: RelationType.W_O,
            relationName: 'Venkateswara Rao',
            doorNo: '5-67',
            street: 'Canal Road',
          },
        },
        landDetails: {
          create: {
            surrenderedVillage: 'Udandarayunipaalem',
            surveyNumber: '36',
            surrenderedAreaSqYds: 1540,
            tdrIssuedExtentSqYds: 2310,
            issuedRatio: '1.5:1',
          },
        },
        documents: {
          create: [
            'OWNERSHIP_DOCUMENT',
            'AADHAAR_COPY',
            'RETURNABLE_PLOT_ALLOTMENT',
            'TDR_ISSUED_COPY',
            'INDIVIDUAL_SKETCH',
          ].map((docType) => ({
            docType: docType as 'OWNERSHIP_DOCUMENT',
            ipfsCid: `bafytest${docType.slice(0, 4)}`,
            supabaseStoragePath: `bonds/TDR-2025-002/${docType}.pdf`,
            sha256Hash: createHash('sha256').update(docType).digest('hex'),
            fileName: `${docType}.pdf`,
            fileSizeKb: 100,
            uploadedBy: officialIds.deo,
          })),
        },
        approvalSteps: {
          create: [
            {
              level: 1,
              role: OfficialRole.DY_TAHSILDAR,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.tah,
              signatureHash: 'test-hash-l1',
              decidedAt: new Date(),
            },
            { level: 2, role: OfficialRole.SDC, decision: ApprovalDecision.PENDING },
            { level: 3, role: OfficialRole.DIRECTOR_LANDS, decision: ApprovalDecision.PENDING },
            { level: 4, role: OfficialRole.COMMISSIONER, decision: ApprovalDecision.PENDING },
          ],
        },
      },
    });

    const bondC = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-003',
        status: BondStatus.ACTIVE,
        farmerId: farmerIds.f3,
        createdBy: officialIds.deo,
        certificateIpfsCid: 'bafybeitest123',
        mintedAt: new Date(Date.now() - 2 * 86400000),
        holder: {
          create: {
            ...holderBase('Sri Krishna Murthy', '9999999997', 'Neerukonda', 'Thullur'),
            doorNo: '8-12',
            street: 'Temple Street',
          },
        },
        landDetails: {
          create: {
            surrenderedVillage: 'Neerukonda',
            surveyNumber: '142/2A',
            surrenderedAreaSqYds: 385,
            tdrIssuedExtentSqYds: 385,
            issuedRatio: '1:1',
          },
        },
        approvalSteps: {
          create: approvalStepsTemplate.map((s, i) => ({
            level: s.level,
            role: s.role,
            decision: ApprovalDecision.APPROVED,
            officialId: Object.values(officialIds)[i + 1],
            signatureHash: `test-hash-l${s.level}`,
            decidedAt: new Date(Date.now() - (4 - i) * 86400000),
          })),
        },
      },
    });

    const bondD = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-004',
        status: BondStatus.REJECTED,
        farmerId: farmerIds.f1,
        createdBy: officialIds.deo,
        rejectionReason: 'Documents incomplete - ownership deed not legible',
        holder: { create: holderBase('Sri Venkata Rao', '9999999999', 'Kanuru', 'Penamaluru') },
        approvalSteps: {
          create: [
            {
              level: 1,
              role: OfficialRole.DY_TAHSILDAR,
              decision: ApprovalDecision.REJECTED,
              officialId: officialIds.tah,
              remarks: 'Documents incomplete - ownership deed not legible',
              decidedAt: new Date(),
            },
            { level: 2, role: OfficialRole.SDC, decision: ApprovalDecision.PENDING },
            { level: 3, role: OfficialRole.DIRECTOR_LANDS, decision: ApprovalDecision.PENDING },
            { level: 4, role: OfficialRole.COMMISSIONER, decision: ApprovalDecision.PENDING },
          ],
        },
      },
    });

    const bondE = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-005',
        status: BondStatus.PENDING_L1,
        farmerId: farmerIds.f4,
        createdBy: officialIds.deo,
        holder: {
          create: {
            ...holderBase('Smt. Lakshmi Devi', '9999999996', 'Mangalagiri', 'Mangalagiri'),
            relationType: RelationType.W_O,
            relationName: 'Srinivas Rao',
            doorNo: '3-21',
            street: 'Guntur Road',
          },
        },
        landDetails: {
          create: {
            surrenderedVillage: 'Mangalagiri',
            surveyNumber: '88/1B',
            surrenderedAreaSqYds: 770,
            tdrIssuedExtentSqYds: 1155,
            issuedRatio: '1.5:1',
          },
        },
        approvalSteps: {
          create: approvalStepsTemplate.map((s) => ({
            level: s.level,
            role: s.role,
            decision: ApprovalDecision.PENDING,
          })),
        },
      },
    });

    const bondF = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-006',
        status: BondStatus.PENDING_L3,
        farmerId: farmerIds.f2,
        createdBy: officialIds.deo,
        holder: {
          create: {
            ...holderBase('Sri Rama Devi', '9999999998', 'Tullur', 'Tullur'),
            doorNo: '7-15',
            street: 'Ring Road',
          },
        },
        landDetails: {
          create: {
            surrenderedVillage: 'Tullur',
            surveyNumber: '201/4',
            surrenderedAreaSqYds: 500,
            tdrIssuedExtentSqYds: 500,
            issuedRatio: '1:1',
          },
        },
        approvalSteps: {
          create: [
            {
              level: 1,
              role: OfficialRole.DY_TAHSILDAR,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.tah,
              signatureHash: 'test-hash-l1',
              decidedAt: new Date(Date.now() - 5 * 86400000),
            },
            {
              level: 2,
              role: OfficialRole.SDC,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.sdc,
              signatureHash: 'test-hash-l2',
              decidedAt: new Date(Date.now() - 3 * 86400000),
            },
            { level: 3, role: OfficialRole.DIRECTOR_LANDS, decision: ApprovalDecision.PENDING },
            { level: 4, role: OfficialRole.COMMISSIONER, decision: ApprovalDecision.PENDING },
          ],
        },
      },
    });

    const bondG = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-007',
        status: BondStatus.PENDING_L4,
        farmerId: farmerIds.f3,
        createdBy: officialIds.deo,
        holder: {
          create: {
            ...holderBase('Sri Krishna Murthy', '9999999997', 'Kanuru', 'Penamaluru'),
            doorNo: '15-8',
            street: 'School Street',
          },
        },
        landDetails: {
          create: {
            surrenderedVillage: 'Kanuru',
            surveyNumber: '55/3',
            surrenderedAreaSqYds: 1200,
            tdrIssuedExtentSqYds: 1800,
            issuedRatio: '1.5:1',
          },
        },
        approvalSteps: {
          create: [
            {
              level: 1,
              role: OfficialRole.DY_TAHSILDAR,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.tah,
              signatureHash: 'test-hash-l1',
              decidedAt: new Date(Date.now() - 10 * 86400000),
            },
            {
              level: 2,
              role: OfficialRole.SDC,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.sdc,
              signatureHash: 'test-hash-l2',
              decidedAt: new Date(Date.now() - 7 * 86400000),
            },
            {
              level: 3,
              role: OfficialRole.DIRECTOR_LANDS,
              decision: ApprovalDecision.APPROVED,
              officialId: officialIds.dir,
              signatureHash: 'test-hash-l3',
              decidedAt: new Date(Date.now() - 2 * 86400000),
            },
            { level: 4, role: OfficialRole.COMMISSIONER, decision: ApprovalDecision.PENDING },
          ],
        },
      },
    });

    const bonds = [bondA, bondB, bondC, bondD, bondE, bondF, bondG];
    let prevHash = GENESIS_HASH;

    for (const bond of bonds) {
      const payload = {
        bondId: bond.id,
        action: `BOND_SEED_${bond.status}`,
        timestamp: new Date().toISOString(),
      };
      const hash = chainHash(prevHash, payload);
      await tx.auditLog.create({
        data: {
          bondId: bond.id,
          action: `BOND_SEED_${bond.status}`,
          chainHash: hash,
          details: payload,
        },
      });
      prevHash = hash;
      console.log(`Created bond ${bond.tdrNumber} (${bond.status})`);
    }
  });

  console.log('Seed complete. Run: npm run auth:sync');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
