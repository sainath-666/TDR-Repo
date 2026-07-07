const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, ImageRun, HeadingLevel, AlignmentType } = require('docx');

// Raw Mermaid code for the three diagrams
const architectureMermaid = `
flowchart TB
    subgraph ClientLayer ["Client Layer"]
        User["Farmer / Official Browser"]
    end
    subgraph AppLayer ["Application Layer (Next.js Node Container)"]
        Frontend["Next.js UI (React / Tailwind)"]
        API["Next.js Route Handlers (API)"]
        PrismaClient["Prisma Client ORM"]
        State["Bond State Machine"]
        HMAC["Security (HMAC Signatures)"]
    end
    subgraph AuthzLayer ["Access Control & Auth"]
        SupabaseAuth["Supabase Auth (SSO / OTP)"]
        Cerbos["Cerbos PDP (Policy Decision Point)"]
    end
    subgraph StorageLayer ["Persistence & Storage"]
        PostgreSQL["Postgres Database (Prisma)"]
        SupabaseStorage["Supabase Storage (PDF Documents)"]
    end
    subgraph BlockchainLayer ["Blockchain & Decentralized Storage"]
        FabricGateway["Hyperledger Fabric Gateway Client"]
        FabricCC["TDR Chaincode (Fabric Contract)"]
        IPFS["IPFS Nodes (Document/Cert CIDs)"]
    end
    User <-->|HTTPS| Frontend
    Frontend <--> API
    API <-->|Check Permissions| Cerbos
    API <-->|Verify Authentication| SupabaseAuth
    API <-->|CRUD Operations| PrismaClient
    API <-->|Upload / Retrieve PDFs| SupabaseStorage
    API <-->|Digital Signature verification| HMAC
    API <-->|Anchor Data & Verify Logs| FabricGateway
    PrismaClient <-->|SQL Queries| PostgreSQL
    FabricGateway <-->|RPC / gRPC| FabricCC
    FabricCC -.->|Reference Storage CIDs| IPFS
    API -.->|Upload Document/Cert| IPFS
`;

const infrastructureMermaid = `
flowchart LR
    subgraph PublicNet ["Public Internet"]
        Client["Browser"]
        SupaCloud["Supabase Cloud Services\\n(Auth & Object Storage)"]
    end
    subgraph VM ["Virtual Machine (Ubuntu 22.04+ / Debian 12)"]
        Nginx["Nginx Container\\n(Reverse Proxy, Port 80/443, SSL)"]
        subgraph DockerBridge ["Docker Bridge Network (apcrda-internal)"]
            NextJS["Next.js App Container\\n(Port 3000)"]
            CerbosPDP["Cerbos PDP Container\\n(Port 3592/3593)"]
            PostgresDB["PostgreSQL 16 Container\\n(Port 5432)"]
        end
        DiskVolume1["PostgreSQL Data Volume"]
        DiskVolume2["Cerbos Config & Policies Volume"]
    end
    subgraph LedgerNetwork ["State / Enterprise Blockchain Network"]
        FabricNet["Hyperledger Fabric Network\\n(Peers & Orderers)"]
        IPFSNet["IPFS Storage Network"]
    end
    Client <-->|HTTPS| Nginx
    Nginx <-->|Forward Port 3000| NextJS
    NextJS <-->|gRPC Port 3593| CerbosPDP
    NextJS <-->|TCP Port 5432| PostgresDB
    NextJS <-->|API / JSON| SupaCloud
    NextJS <-->|gRPC / Gateway API| FabricNet
    NextJS <-->|HTTP API| IPFSNet
    PostgresDB === DiskVolume1
    CerbosPDP === DiskVolume2
`;

const workflowMermaid = `
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_L1 : Approved (DEO/Surveyor)
    DRAFT --> REJECTED : Rejected (DEO/Surveyor)
    PENDING_L1 --> PENDING_L2 : Approved (Tahsildar)
    PENDING_L1 --> REJECTED : Rejected (Tahsildar)
    PENDING_L1 --> DRAFT : Returned (Tahsildar)
    PENDING_L2 --> PENDING_L3 : Approved (SDC)
    PENDING_L2 --> REJECTED : Rejected (SDC)
    PENDING_L2 --> DRAFT : Returned (SDC)
    PENDING_L3 --> PENDING_L4 : Approved (Director)
    PENDING_L3 --> REJECTED : Rejected (Director)
    PENDING_L3 --> DRAFT : Returned (Director)
    PENDING_L4 --> ACTIVE : Approved (Commissioner)
    PENDING_L4 --> REJECTED : Rejected (Commissioner)
    ACTIVE --> REVOKED : Revoked (Commissioner)
`;

// Helper to fetch PNG from Kroki API
async function fetchDiagramImage(mermaidCode) {
  const url = 'https://kroki.io/mermaid/png';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: mermaidCode.trim(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image from Kroki: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateDocx() {
  console.log('Fetching diagram images from Kroki API...');
  
  try {
    const archImg = await fetchDiagramImage(architectureMermaid);
    console.log('✓ Fetched System Architecture Diagram.');
    
    const infraImg = await fetchDiagramImage(infrastructureMermaid);
    console.log('✓ Fetched Infrastructure Topology Diagram.');
    
    const wfImg = await fetchDiagramImage(workflowMermaid);
    console.log('✓ Fetched Workflow/State Diagram.');

    console.log('Building Word Document (.docx)...');

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: 'APCRDA TDR Portal — Flow Diagrams',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),

            // Section 1: System Architecture
            new Paragraph({
              text: '1. System Architecture Flow',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: archImg,
                  transformation: {
                    width: 580,
                    height: 380,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),

            // Section 2: Infrastructure
            new Paragraph({
              text: '2. Infrastructure & Deployment Topology',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: infraImg,
                  transformation: {
                    width: 580,
                    height: 320,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),

            // Section 3: Workflow
            new Paragraph({
              text: '3. Approval Workflow State Machine',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: wfImg,
                  transformation: {
                    width: 580,
                    height: 480,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    const outputPath = path.join(__dirname, '..', 'docs', 'APCRDA-TDR-Portal-Flows.docx');
    
    // Ensure docs directory exists
    const docsDir = path.dirname(outputPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    console.log(`\n🎉 Success! DOCX generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    process.exit(1);
  }
}

generateDocx();
