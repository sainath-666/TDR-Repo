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

async function main() {
  const officialIds = {
    deo: '11111111-1111-1111-1111-111111111101',
    tah: '11111111-1111-1111-1111-111111111102',
    sdc: '11111111-1111-1111-1111-111111111103',
    dir: '11111111-1111-1111-1111-111111111104',
    com: '11111111-1111-1111-1111-111111111105',
  };

  const farmerIds = {
    f1: '22222222-2222-2222-2222-222222222201',
    f2: '22222222-2222-2222-2222-222222222202',
    f3: '22222222-2222-2222-2222-222222222203',
  };

  const aadhaarHash = createHash('sha256').update('999999999999').digest('hex');

  await prisma.$transaction(async (tx) => {
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
    ]);

    const farmers = await Promise.all([
      tx.farmer.create({
        data: {
          id: farmerIds.f1,
          name: 'Sri Venkata Rao',
          aadhaarHash,
          aadhaarPhone: '9999999999',
        },
      }),
      tx.farmer.create({
        data: {
          id: farmerIds.f2,
          name: 'Sri Rama Devi',
          aadhaarHash,
          aadhaarPhone: '9999999998',
        },
      }),
      tx.farmer.create({
        data: {
          id: farmerIds.f3,
          name: 'Sri Krishna Murthy',
          aadhaarHash,
          aadhaarPhone: '9999999997',
        },
      }),
    ]);

    console.log('Created officials:', officials.length, 'farmers:', farmers.length);

    const approvalStepsTemplate = [
      { level: 1, role: OfficialRole.DY_TAHSILDAR },
      { level: 2, role: OfficialRole.SDC },
      { level: 3, role: OfficialRole.DIRECTOR_LANDS },
      { level: 4, role: OfficialRole.COMMISSIONER },
    ];

    const bondA = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-001',
        status: BondStatus.DRAFT,
        farmerId: farmerIds.f1,
        createdBy: officialIds.deo,
        holder: {
          create: {
            name: 'Sri Venkata Rao',
            relationType: RelationType.S_O,
            relationName: 'Rama Rao',
            aadhaarHash,
            aadhaarEncrypted: 'ENCRYPTED_PLACEHOLDER',
            aadhaarPhone: '9999999999',
            doorNo: '12-34',
            street: 'Main Road',
            village: 'Kanuru',
            mandal: 'Penamaluru',
            district: 'KRISHNA',
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

    const bondB = await tx.tdrBond.create({
      data: {
        tdrNumber: 'TDR-2025-002',
        status: BondStatus.PENDING_L2,
        farmerId: farmerIds.f2,
        createdBy: officialIds.deo,
        holder: {
          create: {
            name: 'Sri Rama Devi',
            relationType: RelationType.W_O,
            relationName: 'Venkateswara Rao',
            aadhaarHash,
            aadhaarEncrypted: 'ENCRYPTED_PLACEHOLDER',
            aadhaarPhone: '9999999998',
            doorNo: '5-67',
            street: 'Canal Road',
            village: 'Udandarayunipaalem',
            mandal: 'Penamaluru',
            district: 'KRISHNA',
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
            name: 'Sri Krishna Murthy',
            relationType: RelationType.S_O,
            relationName: 'Subba Rao',
            aadhaarHash,
            aadhaarEncrypted: 'ENCRYPTED_PLACEHOLDER',
            aadhaarPhone: '9999999997',
            doorNo: '8-12',
            street: 'Temple Street',
            village: 'Neerukonda',
            mandal: 'Thullur',
            district: 'KRISHNA',
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
        holder: {
          create: {
            name: 'Sri Venkata Rao',
            relationType: RelationType.S_O,
            relationName: 'Rama Rao',
            aadhaarHash,
            aadhaarEncrypted: 'ENCRYPTED_PLACEHOLDER',
            aadhaarPhone: '9999999999',
            doorNo: '12-34',
            street: 'Main Road',
            village: 'Kanuru',
            mandal: 'Penamaluru',
            district: 'KRISHNA',
          },
        },
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

    const bonds = [bondA, bondB, bondC, bondD];
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
