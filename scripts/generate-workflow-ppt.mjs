/**
 * Generates APCRDA TDR Portal — Complete Application Workflow presentation.
 * Run: npm run ppt:workflow
 */
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'docs', 'APCRDA-TDR-Portal-Workflow.pptx');

// ── Layout constants (16:9 = 10 × 5.625 in) ───────────────────────────────
const L = {
  margin: 0.45,
  headerH: 0.82,
  accentH: 0.03,
  footerY: 5.28,
  contentTop: 1.02,
  contentBottom: 5.05,
  contentH: 4.03,
  slideW: 10,
  slideH: 5.625,
  contentW: 9.1,
};

const C = {
  navy: '1B2A4A',
  blue: '2563EB',
  teal: '0D9488',
  gold: 'D97706',
  dark: '1E293B',
  gray: '64748B',
  light: 'F1F5F9',
  white: 'FFFFFF',
  green: '059669',
  red: 'DC2626',
  purple: '7C3AED',
  sky: 'E0F2FE',
};

const pres = new PptxGenJS();
pres.author = 'APCRDA TDR Portal Team';
pres.company = 'APCRDA';
pres.subject = 'TDR Portal Application Workflow & Architecture';
pres.title = 'APCRDA TDR Portal — Complete Application Workflow';
pres.layout = 'LAYOUT_16x9';

let slideNum = 0;

// ── Shared slide chrome ───────────────────────────────────────────────────
function addHeader(s, title) {
  slideNum++;
  s.background = { color: C.white };
  s.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: L.slideW,
    h: L.headerH,
    fill: { color: C.navy },
  });
  s.addShape(pres.ShapeType.rect, {
    x: 0,
    y: L.headerH,
    w: L.slideW,
    h: L.accentH,
    fill: { color: C.gold },
  });
  s.addText(title, {
    x: L.margin,
    y: 0.14,
    w: L.contentW,
    h: 0.55,
    fontSize: 20,
    bold: true,
    color: C.white,
    fontFace: 'Calibri',
    valign: 'middle',
  });
  s.addText(`APCRDA TDR Portal  |  ${slideNum}`, {
    x: L.margin,
    y: L.footerY,
    w: L.contentW,
    h: 0.25,
    fontSize: 8,
    color: C.gray,
    fontFace: 'Calibri',
  });
}

function normBullet(b) {
  if (typeof b === 'string') return { text: b };
  return b;
}

function bulletsToTextRuns(bullets, baseSize = 13) {
  return bullets
    .filter((raw) => {
      const b = normBullet(raw);
      return !(b.noBullet && b.text === '');
    })
    .map((raw) => {
      const b = normBullet(raw);
      const isNumbered = /^\d+\.\s/.test(b.text);
      const useBullet = !b.noBullet && !isNumbered && b.text.trim() !== '';
      const indent = '   '.repeat(b.indent ?? 0);
      const prefix = useBullet ? (b.indent > 0 ? `${indent}◦ ` : '• ') : indent;

      return {
        text: `${prefix}${b.text}`,
        options: {
          fontSize: b.small ? 11 : baseSize,
          color: b.color || C.dark,
          bold: !!b.bold,
          bullet: false,
          breakLine: true,
          fontFace: 'Calibri',
          paraSpaceAfter: b.tight ? 2 : 6,
        },
      };
    });
}

/** Split bullets into chunks that fit one slide */
function chunkBullets(bullets, maxPerSlide = 6) {
  const chunks = [];
  let current = [];
  for (const b of bullets) {
    const item = normBullet(b);
    if (item.noBullet && item.text === '' && current.length > 0) {
      current.push(b);
      continue;
    }
    if (current.length >= maxPerSlide) {
      chunks.push(current);
      current = [];
    }
    current.push(b);
  }
  if (current.length) chunks.push(current);
  return chunks.length ? chunks : [[]];
}

function addContentSlide(title, bullets, opts = {}) {
  const maxItems = opts.maxItems ?? 6;
  const chunks = chunkBullets(bullets, maxItems);
  chunks.forEach((chunk, i) => {
    const s = pres.addSlide();
    const slideTitle = chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title;
    addHeader(s, slideTitle);
    const fontSize = opts.fontSize ?? (chunk.length > 5 ? 12 : 13);
    s.addText(bulletsToTextRuns(chunk, fontSize), {
      x: L.margin,
      y: L.contentTop,
      w: L.contentW,
      h: L.contentH,
      valign: 'top',
      lineSpacingMultiple: opts.tight ? 1.05 : 1.15,
    });
  });
}

function addTitleSlide(title, subtitle) {
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: L.slideW, h: 0.07, fill: { color: C.gold } });
  s.addText(title, {
    x: 0.6,
    y: 1.7,
    w: 8.8,
    h: 1.2,
    fontSize: 34,
    bold: true,
    color: C.white,
    fontFace: 'Calibri',
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6,
      y: 3.0,
      w: 8.8,
      h: 0.9,
      fontSize: 16,
      color: 'CBD5E1',
      fontFace: 'Calibri',
      lineSpacingMultiple: 1.2,
    });
  }
  s.addText('Andhra Pradesh Capital Region Development Authority', {
    x: 0.6,
    y: 4.7,
    w: 8.8,
    h: 0.4,
    fontSize: 13,
    color: C.gold,
    fontFace: 'Calibri',
    italic: true,
  });
}

function addSectionSlide(title, num) {
  const s = pres.addSlide();
  s.background = { color: C.blue };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: L.slideH, fill: { color: C.gold } });
  s.addText(String(num).padStart(2, '0'), {
    x: 0.45,
    y: 1.4,
    w: 2,
    h: 1.2,
    fontSize: 64,
    bold: true,
    color: '93C5FD',
    fontFace: 'Calibri',
  });
  s.addText(title, {
    x: 0.45,
    y: 2.8,
    w: 9,
    h: 1.0,
    fontSize: 28,
    bold: true,
    color: C.white,
    fontFace: 'Calibri',
  });
}

function addTableSlide(title, headers, rows, colW, opts = {}) {
  const maxRows = opts.maxRows ?? 7;
  const chunks = [];
  for (let i = 0; i < rows.length; i += maxRows) {
    chunks.push(rows.slice(i, i + maxRows));
  }
  if (!chunks.length) chunks.push([]);

  chunks.forEach((chunk, ci) => {
    const s = pres.addSlide();
    const slideTitle = chunks.length > 1 ? `${title} (${ci + 1}/${chunks.length})` : title;
    addHeader(s, slideTitle);

    const fs = opts.fontSize ?? 9;
    const rh = opts.rowH ?? 0.34;
    const tableRows = [
      headers.map((h) => ({
        text: h,
        options: {
          bold: true,
          color: C.white,
          fill: { color: C.navy },
          fontSize: fs + 1,
          fontFace: 'Calibri',
          align: 'center',
          valign: 'middle',
        },
      })),
      ...chunk.map((row, ri) =>
        row.map((cell) => ({
          text: cell,
          options: {
            fontSize: fs,
            fontFace: 'Calibri',
            fill: { color: ri % 2 === 0 ? C.light : C.white },
            color: C.dark,
            valign: 'middle',
          },
        })),
      ),
    ];

    const tableH = (chunk.length + 1) * rh;
    const tableY = L.contentTop + Math.max(0, (L.contentH - tableH) / 2 - 0.1);

    s.addTable(tableRows, {
      x: L.margin,
      y: tableY,
      w: L.contentW,
      colW: colW || headers.map(() => L.contentW / headers.length),
      border: { type: 'solid', color: 'CBD5E1', pt: 0.5 },
      rowH: rh,
      autoPage: false,
    });
  });
}

/** Layered architecture diagram */
function addLayerArchSlide(title, layers) {
  const s = pres.addSlide();
  addHeader(s, title);

  const count = layers.length;
  const gap = 0.1;
  const totalGap = gap * (count - 1);
  const layerH = (L.contentH - totalGap) / count;

  layers.forEach((layer, i) => {
    const y = L.contentTop + i * (layerH + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x: L.margin,
      y,
      w: L.contentW,
      h: layerH,
      fill: { color: layer.bg || C.light },
      line: { color: layer.border || C.blue, width: 1 },
      rectRadius: 0.06,
    });
    s.addShape(pres.ShapeType.rect, {
      x: L.margin,
      y,
      w: 0.08,
      h: layerH,
      fill: { color: layer.accent || C.blue },
    });
    s.addText(layer.name, {
      x: L.margin + 0.2,
      y: y + 0.06,
      w: 2.2,
      h: layerH - 0.12,
      fontSize: 11,
      bold: true,
      color: layer.accent || C.navy,
      fontFace: 'Calibri',
      valign: 'middle',
    });
    s.addText(layer.items, {
      x: L.margin + 2.4,
      y: y + 0.06,
      w: L.contentW - 2.6,
      h: layerH - 0.12,
      fontSize: 10,
      color: C.dark,
      fontFace: 'Calibri',
      valign: 'middle',
    });
    if (i < count - 1) {
      s.addText('▼', {
        x: 4.7,
        y: y + layerH - 0.02,
        w: 0.6,
        h: gap + 0.12,
        fontSize: 9,
        color: C.gray,
        align: 'center',
        fontFace: 'Calibri',
      });
    }
  });
}

/** Horizontal flow boxes — auto-wrap to 2 rows if needed */
function addFlowSlide(title, steps, subtitle) {
  const s = pres.addSlide();
  addHeader(s, title);

  if (subtitle) {
    s.addText(subtitle, {
      x: L.margin,
      y: L.contentTop,
      w: L.contentW,
      h: 0.35,
      fontSize: 11,
      color: C.gray,
      fontFace: 'Calibri',
      italic: true,
    });
  }

  const startY = subtitle ? L.contentTop + 0.4 : L.contentTop + 0.5;
  const perRow = steps.length > 5 ? 3 : steps.length;
  const rows = Math.ceil(steps.length / perRow);
  const boxW = (L.contentW - (perRow - 1) * 0.2) / perRow;
  const boxH = rows > 1 ? 0.75 : 0.9;
  const rowGap = 0.55;
  const colors = [C.blue, C.teal, C.green, C.gold, C.purple, C.navy];

  steps.forEach((step, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowSteps = Math.min(perRow, steps.length - row * perRow);
    const rowW = rowSteps * boxW + (rowSteps - 1) * 0.2;
    const rowStartX = L.margin + (L.contentW - rowW) / 2;
    const x = rowStartX + col * (boxW + 0.2);
    const y = startY + row * rowGap;

    s.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w: boxW,
      h: boxH,
      fill: { color: colors[i % colors.length] },
      rectRadius: 0.06,
    });
    s.addText(step, {
      x,
      y: y + 0.05,
      w: boxW,
      h: boxH - 0.1,
      fontSize: 9,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'middle',
      fontFace: 'Calibri',
    });
    if (col < rowSteps - 1) {
      s.addText('→', {
        x: x + boxW,
        y: y + boxH / 2 - 0.15,
        w: 0.2,
        h: 0.3,
        fontSize: 12,
        color: C.gray,
        align: 'center',
        fontFace: 'Calibri',
      });
    }
  });
}

/** Two-column slide for balanced layout */
function addTwoColSlide(title, left, right) {
  const s = pres.addSlide();
  addHeader(s, title);
  const colW = (L.contentW - 0.3) / 2;

  [left, right].forEach((col, ci) => {
    const x = L.margin + ci * (colW + 0.3);
    s.addShape(pres.ShapeType.roundRect, {
      x,
      y: L.contentTop,
      w: colW,
      h: L.contentH,
      fill: { color: C.light },
      line: { color: 'CBD5E1', width: 0.5 },
      rectRadius: 0.05,
    });
    s.addText(col.title, {
      x: x + 0.15,
      y: L.contentTop + 0.1,
      w: colW - 0.3,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: C.navy,
      fontFace: 'Calibri',
    });
    s.addText(bulletsToTextRuns(col.bullets, 11), {
      x: x + 0.15,
      y: L.contentTop + 0.45,
      w: colW - 0.3,
      h: L.contentH - 0.55,
      valign: 'top',
      lineSpacingMultiple: 1.1,
    });
  });
}

/** Box diagram for architecture components */
function addComponentDiagram(title, rows) {
  const s = pres.addSlide();
  addHeader(s, title);

  const boxW = 1.55;
  const boxH = 0.55;
  const hGap = 0.25;
  const vGap = 0.35;

  rows.forEach((row, ri) => {
    const count = row.length;
    const totalW = count * boxW + (count - 1) * hGap;
    let x = L.margin + (L.contentW - totalW) / 2;
    const y = L.contentTop + 0.2 + ri * (boxH + vGap);

    row.forEach((comp) => {
      s.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: boxW,
        h: boxH,
        fill: { color: comp.bg || C.sky },
        line: { color: comp.border || C.blue, width: 1 },
        rectRadius: 0.05,
      });
      s.addText(comp.label, {
        x,
        y: y + 0.05,
        w: boxW,
        h: boxH - 0.1,
        fontSize: 9,
        bold: true,
        color: C.navy,
        align: 'center',
        valign: 'middle',
        fontFace: 'Calibri',
      });
      if (comp.sub) {
        s.addText(comp.sub, {
          x,
          y: y + boxH + 0.02,
          w: boxW,
          h: 0.25,
          fontSize: 7,
          color: C.gray,
          align: 'center',
          fontFace: 'Calibri',
        });
      }
      x += boxW + hGap;
    });

    if (ri < rows.length - 1) {
      s.addText('▼', {
        x: 4.8,
        y: y + boxH + 0.15,
        w: 0.4,
        h: 0.2,
        fontSize: 10,
        color: C.gray,
        align: 'center',
        fontFace: 'Calibri',
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// TITLE & AGENDA
// ══════════════════════════════════════════════════════════════════════════
addTitleSlide(
  'APCRDA TDR Portal',
  'Complete Application Workflow & System Architecture\nTransferable Development Rights Management System',
);

addContentSlide(
  'Agenda',
  [
    { text: '1. Domain Context — APCRDA, Amaravati LPS & TDR', bold: true },
    { text: '2. Application Overview & Technology Stack', bold: true },
    {
      text: '3. System Architecture (Layered, Request Flow, Deployment)',
      bold: true,
      color: C.blue,
    },
    { text: '4. User Roles & 5-Stage Approval Chain', bold: true },
    { text: '5. Authentication Architecture (Farmer OTP + Official Supabase)', bold: true },
    { text: '6. Portal Routes & Middleware Protection', bold: true },
    { text: '7. Bond Lifecycle & End-to-End Workflow', bold: true },
    { text: '8. Security — Cerbos, Fabric Blockchain & Audit Trail', bold: true },
    { text: '9. API Routes, Database Schema & User Journeys', bold: true },
  ],
  { maxItems: 9, fontSize: 14 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 01 — DOMAIN
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Domain Context', 1);

addContentSlide(
  'About APCRDA & Amaravati LPS',
  [
    { text: 'APCRDA — Andhra Pradesh Capital Region Development Authority', bold: true },
    'Greenfield capital Amaravati developed after AP bifurcation (2014)',
    'Land Pooling Scheme: 25,000+ farmers pooled 30,000+ acres',
    'Govt. promised developed plots in proportionate ratio',
    { text: 'Portal Purpose', bold: true },
    'Digital TDR certificate management for land pooling beneficiaries',
    'Multi-level approval pipeline with blockchain audit trail',
  ],
  { maxItems: 6 },
);

addContentSlide(
  'What is TDR?',
  [
    { text: 'Legal Definition (APCRDA Act 2014)', bold: true },
    'Right to transfer development potential of a plot — expressed as permissible built space (FSI/FAR)',
    { text: 'In Practice', bold: true },
    'Farmers who pooled land receive TDR bonds as compensation',
    'TDR transferable to receiving districts for increased density',
    'Each bond: holder, land, survey no., extent, ratio',
    'After 5-stage approval → ACTIVE certificate (PDF + QR)',
  ],
  { maxItems: 6 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 02 — APPLICATION OVERVIEW
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Application Overview', 2);

addTwoColSlide(
  'Application at a Glance',
  {
    title: 'Application Details',
    bullets: [
      { text: 'Name: apcrda-tdr', bold: true },
      'Next.js 14 Web App (App Router)',
      'Users: Farmers + 5 govt. official levels',
      { text: 'Bonds synced as DRAFT', bold: true, color: C.gold },
      'Farmers do NOT submit in-app',
    ],
  },
  {
    title: 'Core Capabilities',
    bullets: [
      '5-stage approval pipeline',
      'Dual auth: OTP + Supabase',
      'Cerbos policy authorization',
      'Fabric blockchain audit trail',
      'Public certificate verification',
    ],
  },
);

addContentSlide(
  'Technology Stack',
  [
    { text: 'Frontend', bold: true },
    'Next.js 14 · React 18 · TypeScript · Tailwind CSS',
    { text: 'Data', bold: true },
    'PostgreSQL · Prisma ORM · Supabase Auth (officials)',
    { text: 'Security', bold: true },
    'Cerbos PDP · HMAC sessions · bcrypt OTP · Aadhaar encryption',
    { text: 'Blockchain', bold: true },
    'Hyperledger Fabric chaincode',
    { text: 'Documents', bold: true },
    'PDFKit · QRCode · IPFS CID · Supabase Storage',
    { text: 'Infrastructure', bold: true },
    'Docker Compose · Cerbos · Fabric network · PWA',
  ],
  { maxItems: 6, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 03 — SYSTEM ARCHITECTURE  ★ NEW
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('System Architecture', 3);

addLayerArchSlide('Layered System Architecture', [
  {
    name: 'Presentation Layer',
    items:
      'Next.js Pages · React Components · Farmer/Official Dashboards · BondReviewPanel · Public Portal',
    bg: 'EFF6FF',
    accent: C.blue,
  },
  {
    name: 'API & Middleware',
    items:
      'middleware.ts (auth guard) · API Routes · getCurrentUser() · Route access control · Idle timeout',
    bg: 'F0FDFA',
    accent: C.teal,
  },
  {
    name: 'Business Logic',
    items:
      'approval-handler.ts · bond-state-machine.ts · approval-chain.ts · certificate/mint.ts · audit.ts',
    bg: 'F0FDF4',
    accent: C.green,
  },
  {
    name: 'Authorization & Blockchain',
    items: 'Cerbos PDP (withCerbos) · Fabric Gateway (createBond, recordApproval, mintCertificate)',
    bg: 'FFFBEB',
    accent: C.gold,
  },
  {
    name: 'Data Layer',
    items: 'Prisma ORM · PostgreSQL · Supabase Auth · Document Storage · Hash-chained Audit Log',
    bg: 'F5F3FF',
    accent: C.purple,
  },
]);

addComponentDiagram('Request Flow Architecture', [
  [{ label: 'Browser\n(Client)', bg: 'DBEAFE' }],
  [{ label: 'Next.js\nMiddleware', bg: 'CCFBF1', sub: 'Auth + Route Guard' }],
  [{ label: 'API Routes\n/ Pages', bg: 'D1FAE5' }],
  [
    { label: 'Cerbos\nPDP', bg: 'FEF3C7' },
    { label: 'approval-\nhandler', bg: 'FEF3C7' },
    { label: 'Fabric\nGateway', bg: 'FEF3C7' },
  ],
  [
    { label: 'PostgreSQL\n(Prisma)', bg: 'EDE9FE' },
    { label: 'Audit Log\n(Hash Chain)', bg: 'EDE9FE' },
    { label: 'Certificate\nPDF Store', bg: 'EDE9FE' },
  ],
]);

addTwoColSlide(
  'Authentication Architecture',
  {
    title: 'Farmer (Citizen)',
    bullets: [
      '/farmer-login',
      'POST /api/auth/otp/request',
      'POST /api/auth/otp/verify',
      'citizen_session cookie',
      'HMAC-signed (not Supabase)',
      'Protected: /farmer/*',
    ],
  },
  {
    title: 'Official (Government)',
    bullets: [
      '/official-login',
      'Supabase signInWithPassword',
      'JWT + app_metadata.role',
      'Auth hook: role, district',
      'Protected: /deo/*, /official/*',
      'Optional Google SSO',
    ],
  },
);

addLayerArchSlide('Deployment & Infrastructure Architecture', [
  {
    name: 'Application Tier',
    items: 'Next.js 14 App (npm run dev / Docker) · PWA · API Routes · Server Components',
    bg: 'EFF6FF',
    accent: C.blue,
  },
  {
    name: 'Auth Services',
    items: 'Supabase Auth (officials) · Citizen HMAC Sessions (farmers) · JWT Custom Claims Hook',
    bg: 'F0FDFA',
    accent: C.teal,
  },
  {
    name: 'Policy & Blockchain',
    items: 'Cerbos PDP Container (docker compose) · Hyperledger Fabric Network (fabric/network/)',
    bg: 'FFFBEB',
    accent: C.gold,
  },
  {
    name: 'Data & Storage',
    items: 'PostgreSQL (Prisma) · Supabase Storage (documents) · Local/IPFS (certificates)',
    bg: 'F5F3FF',
    accent: C.purple,
  },
  {
    name: 'External Integration',
    items: 'APCRDA Adapter (land records, KYC, GIS) · SMS Gateway (OTP) · OAuth (SSO)',
    bg: 'FEF2F2',
    accent: C.red,
  },
]);

addComponentDiagram('Approval Processing Architecture', [
  [{ label: 'BondReviewPanel\n(UI)', bg: 'DBEAFE' }],
  [{ label: 'POST /api/approvals\n/[bondId]/approve', bg: 'CCFBF1' }],
  [
    { label: 'getCurrentUser()', bg: 'D1FAE5' },
    { label: 'bond-state-\nmachine', bg: 'D1FAE5' },
    { label: 'Cerbos\nwithCerbos()', bg: 'D1FAE5' },
  ],
  [
    { label: 'fabric.record\nApproval()', bg: 'FEF3C7' },
    { label: 'Prisma\nTransaction', bg: 'FEF3C7' },
    { label: 'writeAudit\nLog()', bg: 'FEF3C7' },
  ],
  [
    {
      label: 'Certificate Mint\n(if L4 Approve)',
      bg: 'EDE9FE',
      sub: 'prepareBondCertificate → ACTIVE',
    },
  ],
]);

addContentSlide(
  'Data Architecture — Entity Relationships',
  [
    { text: 'TdrBond (central)', bold: true, color: C.blue },
    '1:1 BondHolder · 1:1 BondLandDetail · 1:N BondDocument · 1:N ApprovalStep',
    { text: 'Users', bold: true },
    'Farmer (phone, no Supabase) · Official (Supabase-synced, role + district)',
    { text: 'Audit & Security', bold: true },
    'AuditLog (hash-chained) · OtpRequest · IdempotencyCache',
    { text: 'Master Data', bold: true },
    'Village (GIS master) · 5 document types per bond',
  ],
  { maxItems: 6, fontSize: 12 },
);

addContentSlide(
  'Security Architecture',
  [
    { text: 'Authentication', bold: true },
    'Dual system: HMAC citizen cookies + Supabase JWT with custom claims',
    { text: 'Authorization', bold: true },
    'Cerbos PDP — district-scoped YAML policies for bond, approval, cert, document',
    { text: 'Data Protection', bold: true },
    'Aadhaar hashed/encrypted · bcrypt OTP · HMAC approval signatures',
    { text: 'Audit & Integrity', bold: true },
    'Hash-chained audit log · Fabric blockchain · cerbosCallId + fabricTxId join keys',
  ],
  { maxItems: 5, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 04 — ROLES
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('User Roles & Approval Chain', 4);

addTableSlide(
  'User Roles & Capabilities',
  ['Role', 'Dashboard', 'Capability'],
  [
    ['FARMER', '/farmer/dashboard', 'View bonds, download ACTIVE certificates'],
    ['DEO / SURVEYOR', '/deo/dashboard', 'Intake review of DRAFT bonds'],
    ['TAHSILDAR', '/official/dashboard', 'Approve/reject/return at PENDING_L1'],
    ['SDC', '/official/dashboard', 'Approve/reject/return at PENDING_L2'],
    ['DIRECTOR_LANDS', '/official/dashboard', 'Approve/reject/return at PENDING_L3'],
    ['COMMISSIONER', '/official/dashboard', 'Final approve at L4; mint certificate'],
  ],
  [2.0, 2.5, 4.6],
  { fontSize: 9, rowH: 0.36 },
);

addContentSlide(
  '5-Stage Approval Chain',
  [
    { text: 'Stage 1 — DEO (Intake)', bold: true, color: C.blue },
    'DRAFT → Approve: PENDING_L1 | Reject: REJECTED',
    { text: 'Stage 2 — Tahsildar (L1)', bold: true, color: C.teal },
    'PENDING_L1 → Approve/Reject/Return to DRAFT',
    { text: 'Stage 3 — SDC (L2)', bold: true, color: C.green },
    'PENDING_L2 → Approve/Reject/Return to DRAFT',
    { text: 'Stage 4 — Director (L3)', bold: true, color: C.gold },
    'PENDING_L3 → Approve/Reject/Return to DRAFT',
    { text: 'Stage 5 — Commissioner (L4)', bold: true, color: C.purple },
    'PENDING_L4 → Approve: ACTIVE (cert mint) | Reject',
  ],
  { maxItems: 6, fontSize: 12 },
);

addFlowSlide(
  'Approval Pipeline Flow',
  [
    'DRAFT\n(DEO)',
    'PENDING_L1\n(Tahsildar)',
    'PENDING_L2\n(SDC)',
    'PENDING_L3\n(Director)',
    'PENDING_L4\n(Commissioner)',
    'ACTIVE\n(Certificate)',
  ],
  'Bond status progression through the 5-stage pipeline',
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 05 — AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Authentication System', 5);

addTwoColSlide(
  'Dual Authentication System',
  {
    title: 'Why Two Systems?',
    bullets: [
      'Farmers: no govt. email',
      'Lightweight OTP login',
      'HMAC cookie session',
      'No Supabase account',
    ],
  },
  {
    title: 'Official Auth',
    bullets: [
      'Govt. employees',
      'Supabase email/password',
      'JWT role claims',
      'Optional Google SSO',
    ],
  },
);

addContentSlide(
  'Farmer Login Flow',
  [
    { text: '1. Visit /farmer-login — enter phone', bold: true },
    { text: '2. POST /api/auth/otp/request — lookup farmer', bold: true },
    { text: '3. POST /api/auth/otp/verify — verify OTP', bold: true },
    'Sets HMAC-signed citizen_session cookie',
    { text: '4. Middleware validates → /farmer/dashboard', bold: true },
    { text: 'Demo: 9666666666 / OTP 123456', color: C.gray },
  ],
  { maxItems: 6, fontSize: 12 },
);

addContentSlide(
  'Official Login Flow',
  [
    { text: '1. Visit /official-login — email + password', bold: true },
    { text: '2. Supabase signInWithPassword()', bold: true },
    { text: '3. JWT claims: role, district_code, employee_id', bold: true },
    { text: '4. Redirect: DEO → /deo/dashboard | Others → /official/dashboard', bold: true },
    { text: 'Provisioning: npm run auth:sync', color: C.gray },
    { text: 'Demo: deo001@apcrda.org / Test@123', color: C.gray },
  ],
  { maxItems: 6, fontSize: 12 },
);

addContentSlide(
  'Middleware & Route Protection',
  [
    { text: 'Public (no auth)', bold: true },
    '/, /farmer-login, /official-login, /verify, /tdr-bank, /calculator',
    { text: 'Farmer (citizen_session)', bold: true },
    '/farmer/*, /api/bonds/farmer/*, /api/dashboard/farmer',
    { text: 'Official (Supabase JWT)', bold: true },
    '/deo/*, /official/*, /api/approvals/*',
    { text: 'Security: 30-min idle timeout · role-based checkRouteAccess()', color: C.gray },
  ],
  { maxItems: 5, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 06 — ROUTES
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Portal Routes & Pages', 6);

addTableSlide(
  'Public Routes',
  ['Route', 'Purpose'],
  [
    ['/', 'Landing — APCRDA & TDR info'],
    ['/farmer-login', 'Citizen OTP login'],
    ['/official-login', 'Official login'],
    ['/verify/[tdrNumber]', 'Public certificate verify'],
    ['/tdr-bank', 'TDR bank listing'],
    ['/calculator', 'TDR calculator'],
    ['/status', 'Bond status lookup'],
  ],
  [2.8, 6.3],
  { fontSize: 9, rowH: 0.34 },
);

addTableSlide(
  'Authenticated Routes',
  ['Role', 'Route', 'Purpose'],
  [
    ['Farmer', '/farmer/dashboard', 'Bond list & status tracker'],
    ['Farmer', '/farmer/certificates/[id]', 'Certificate download'],
    ['DEO', '/deo/dashboard', 'DRAFT bond queue'],
    ['DEO', '/deo/bonds/[id]/review', 'Intake review panel'],
    ['Official', '/official/dashboard', 'Approval queue'],
    ['Official', '/official/bonds/[id]/review', 'Review panel'],
  ],
  [1.1, 3.0, 5.0],
  { fontSize: 9, rowH: 0.34 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 07 — BOND LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Bond Lifecycle', 7);

addContentSlide(
  'Bond Status State Machine',
  [
    { text: 'Forward path:', bold: true },
    'DRAFT → PENDING_L1 → L2 → L3 → L4 → ACTIVE',
    { text: 'Terminal states:', bold: true },
    'REJECTED (any stage) · REVOKED (Commissioner from ACTIVE)',
    { text: 'Return path (L1–L3 only):', bold: true, color: C.gold },
    'Any L1–L3 official can return bond to DRAFT with remarks',
  ],
  { maxItems: 4, fontSize: 13 },
);

addTableSlide(
  'Status Transition Rules',
  ['Status', 'Action', 'Role', 'Next Status'],
  [
    ['DRAFT', 'Approve', 'DEO', 'PENDING_L1'],
    ['DRAFT', 'Reject', 'DEO', 'REJECTED'],
    ['PENDING_L1', 'Approve/Reject/Return', 'Tahsildar', 'L2 / REJECTED / DRAFT'],
    ['PENDING_L2', 'Approve/Reject/Return', 'SDC', 'L3 / REJECTED / DRAFT'],
    ['PENDING_L3', 'Approve/Reject/Return', 'Director', 'L4 / REJECTED / DRAFT'],
    ['PENDING_L4', 'Approve/Reject', 'Commissioner', 'ACTIVE / REJECTED'],
    ['ACTIVE', 'Revoke', 'Commissioner', 'REVOKED'],
  ],
  [1.6, 1.5, 1.8, 2.2],
  { fontSize: 8, rowH: 0.33 },
);

addContentSlide(
  'Bond Data Model',
  [
    { text: 'TdrBond', bold: true },
    'tdrNumber, status, farmerId, fabricTxId, certificate fields',
    { text: 'BondHolder', bold: true },
    'Name, Aadhaar (encrypted), address, district',
    { text: 'BondLandDetail', bold: true },
    'Survey no., village, extent, TDR ratio',
    { text: 'BondDocument (×5)', bold: true },
    'Ownership, Aadhaar, Plot, TDR copy, Sketch',
    { text: 'ApprovalStep (L1–L4)', bold: true },
    'Decision, signature, cerbos/fabric IDs',
  ],
  { maxItems: 5, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 08 — END-TO-END WORKFLOW
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('End-to-End Workflow', 8);

addContentSlide(
  'Phase 1 — External Bond Sync',
  [
    { text: 'Bonds synced from APCRDA (not created in-app)', bold: true, color: C.gold },
    'apcrda-adapter.ts: land records, KYC, GIS data',
    'Created as DRAFT with holder, land, 5 documents',
    '4 pending ApprovalSteps (L1–L4)',
    { text: 'Dev: npm run db:seed', color: C.gray },
  ],
  { maxItems: 5, fontSize: 12 },
);

addContentSlide(
  'Phase 2 — DEO Intake Review',
  [
    { text: 'UI: /deo/dashboard → /deo/bonds/[id]/review', bold: true },
    'Reviews holder, land, all 5 documents',
    { text: 'Approve', bold: true, color: C.green },
    '→ PENDING_L1 + fabric.createBond()',
    { text: 'Reject', bold: true, color: C.red },
    '→ REJECTED (no return at intake)',
    'Cerbos check → DB update → Audit: INTAKE_APPROVED',
  ],
  { maxItems: 5, fontSize: 12 },
);

addContentSlide(
  'Phase 3 — L1 to L4 Pipeline',
  [
    { text: 'L1 Tahsildar', bold: true, color: C.teal },
    '→ PENDING_L2 | Reject | Return',
    { text: 'L2 SDC', bold: true, color: C.green },
    '→ PENDING_L3 | Reject | Return',
    { text: 'L3 Director', bold: true, color: C.gold },
    '→ PENDING_L4 | Reject | Return',
    { text: 'L4 Commissioner', bold: true, color: C.purple },
    '→ ACTIVE | Reject (no return)',
    'Each: Cerbos → fabric.recordApproval() → DB → Audit log',
  ],
  { maxItems: 5, fontSize: 12 },
);

addContentSlide(
  'Phase 4 — Certificate Minting',
  [
    { text: 'Triggered on Commissioner L4 Approve', bold: true },
    'prepareBondCertificate(): PDF + QR code → /verify/[tdrNumber]',
    'fabric.mintCertificate() on blockchain',
    'DB: certificateIpfsCid, certificateStoragePath, mintedAt',
    'Audit: L4_APPROVED → CERT_MINTED',
  ],
  { maxItems: 5, fontSize: 12 },
);

addContentSlide(
  'Phase 5 — Farmer Certificate Access',
  [
    { text: '1. OTP login → /farmer/dashboard', bold: true },
    { text: '2. View ACTIVE bonds & status tracker', bold: true },
    { text: '3. /farmer/certificates/[id] → download PDF', bold: true },
    { text: 'Public verify: /verify/[tdrNumber] (no login)', bold: true, color: C.teal },
  ],
  { maxItems: 4, fontSize: 13 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 09 — SECURITY & BLOCKCHAIN
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Security & Blockchain', 9);

addContentSlide(
  'Cerbos Authorization',
  [
    { text: 'Every action calls withCerbos() before execution', bold: true },
    { text: 'Policies (cerbos/policies/)', bold: true },
    'resource_bond · resource_approval · resource_certificate · resource_document',
    'derived_roles.yaml — district-scoped roles',
    'ALLOW/DENY → cerbosCallId in audit log',
  ],
  { maxItems: 5, fontSize: 12 },
);

addTableSlide(
  'Hyperledger Fabric Integration',
  ['Function', 'Trigger', 'Gateway Method'],
  [
    ['CreateBond', 'DEO intake approve', 'fabric.createBond()'],
    ['RecordApproval', 'L1–L4 decision', 'fabric.recordApproval()'],
    ['MintCertificate', 'Commissioner approve', 'fabric.mintCertificate()'],
    ['GetBond / History', 'Query/audit', 'fabric.getBond()'],
  ],
  [2.0, 2.8, 4.3],
  { fontSize: 9, rowH: 0.38 },
);

addContentSlide(
  'Fabric Network Setup',
  [
    { text: 'Network: fabric/network/ (Docker Compose)', bold: true },
    'Chaincode: fabric/chaincode/tdr-bond-cc/index.js',
    'Bootstrap: npm run fabric:bootstrap → fabric:deploy-cc',
    { text: 'Mock mode: FABRIC_MOCK_MODE=true', bold: true, color: C.gold },
    'Simulates blockchain; business logic runs normally',
  ],
  { maxItems: 4, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 10 — API & DATABASE
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('API & Database', 10);

addTableSlide(
  'API Routes — Authentication',
  ['Method', 'Route', 'Purpose'],
  [
    ['POST', '/api/auth/otp/request', 'Farmer OTP request'],
    ['POST', '/api/auth/otp/verify', 'Verify + citizen session'],
    ['POST', '/api/auth/official/login', 'Official Supabase login'],
    ['POST', '/api/auth/logout', 'Logout both auth types'],
  ],
  [0.9, 3.5, 4.7],
  { fontSize: 9, rowH: 0.36 },
);

addTableSlide(
  'API Routes — Bonds & Approvals',
  ['Method', 'Route', 'Purpose'],
  [
    ['GET', '/api/bonds', 'Official bond list (role-scoped)'],
    ['GET', '/api/bonds/farmer/mine', 'Farmer bonds'],
    ['GET', '/api/approvals/queue', 'Pending approval queue'],
    ['POST', '/api/approvals/[id]/approve', 'Approve bond'],
    ['POST', '/api/approvals/[id]/reject', 'Reject bond'],
    ['POST', '/api/approvals/[id]/return', 'Return to DEO (L1–L3)'],
  ],
  [0.9, 3.5, 4.7],
  { fontSize: 9, rowH: 0.33 },
);

addTableSlide(
  'API Routes — Certificates & Admin',
  ['Method', 'Route', 'Purpose'],
  [
    ['GET', '/api/certificates/[id]/verify', 'Public verification'],
    ['GET', '/api/certificates/[id]/download', 'PDF download'],
    ['GET', '/api/dashboard/farmer', 'Farmer dashboard data'],
    ['GET', '/api/dashboard/official', 'Official dashboard data'],
    ['GET', '/api/health', 'System health check'],
    ['GET/POST', '/api/users/officials', 'Manage officials'],
  ],
  [0.9, 3.5, 4.7],
  { fontSize: 9, rowH: 0.33 },
);

addTableSlide(
  'Database — Key Entities',
  ['Model', 'Table', 'Purpose'],
  [
    ['TdrBond', 'tdr_bonds', 'Core bond record'],
    ['BondHolder', 'bond_holders', 'Holder identity'],
    ['BondLandDetail', 'bond_land_details', 'Land & TDR extent'],
    ['BondDocument', 'bond_documents', '5 supporting documents'],
    ['ApprovalStep', 'approval_steps', 'L1–L4 decisions'],
    ['Official / Farmer', 'officials / farmers', 'User accounts'],
    ['AuditLog', 'audit_log', 'Hash-chained audit trail'],
  ],
  [1.5, 2.2, 5.4],
  { fontSize: 9, rowH: 0.33 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 11 — AUDIT & OPERATIONS
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Audit & Operations', 11);

addContentSlide(
  'Immutable Audit Trail',
  [
    { text: 'Hash-chained log: src/lib/audit.ts', bold: true },
    { text: 'Events recorded:', bold: true },
    'Auth (login/logout) · Intake (INTAKE_APPROVED/REJECTED)',
    'Pipeline (L1–L4 APPROVED/REJECTED/RETURNED) · CERT_MINTED',
    { text: 'Join keys: cerbosCallId + fabricTxId', bold: true, color: C.teal },
  ],
  { maxItems: 5, fontSize: 12 },
);

addTwoColSlide(
  'Dev Setup & Design Decisions',
  {
    title: 'Essential Commands',
    bullets: [
      'npm run dev — start server',
      'npm run db:seed — seed data',
      'npm run auth:sync — Supabase sync',
      'npm run stack:up — DB + Cerbos',
      'npm run fabric:bootstrap',
    ],
  },
  {
    title: 'Key Design Decisions',
    bullets: [
      'Dual auth (farmer + official)',
      'No in-app bond creation',
      'District-scoped queues',
      'Return workflow L1–L3',
      'Mock-first development',
    ],
  },
);

// ══════════════════════════════════════════════════════════════════════════
// USER JOURNEYS
// ══════════════════════════════════════════════════════════════════════════
addContentSlide(
  'User Journey — Farmer',
  [
    { text: '1. /farmer-login → OTP verify', bold: true },
    { text: '2. Dashboard — view all bonds & status', bold: true },
    { text: '3. Track: DRAFT → L1 → L2 → L3 → L4 → ACTIVE', bold: true },
    { text: '4. Download certificate PDF when ACTIVE', bold: true },
    { text: '5. Share QR for public verification', bold: true },
  ],
  { maxItems: 5, fontSize: 13 },
);

addTwoColSlide(
  'User Journeys — Officials',
  {
    title: 'DEO (Intake)',
    bullets: [
      'Login → /deo/dashboard',
      'Review DRAFT bonds',
      'Check holder, land, docs',
      'Approve → enters pipeline',
      'Reject → REJECTED',
    ],
  },
  {
    title: 'L1–L4 Officials',
    bullets: [
      'Login → /official/dashboard',
      'Role-scoped queue',
      'Review bond details',
      'Approve / Reject / Return',
      'L4 Approve → cert mint',
    ],
  },
);

// ══════════════════════════════════════════════════════════════════════════
// FINAL
// ══════════════════════════════════════════════════════════════════════════
const finalSlide = pres.addSlide();
finalSlide.background = { color: C.navy };
finalSlide.addShape(pres.ShapeType.rect, {
  x: 0,
  y: 0,
  w: L.slideW,
  h: 0.07,
  fill: { color: C.gold },
});
finalSlide.addText('Thank You', {
  x: 0.6,
  y: 1.9,
  w: 8.8,
  h: 1.0,
  fontSize: 40,
  bold: true,
  color: C.white,
  align: 'center',
  fontFace: 'Calibri',
});
finalSlide.addText('APCRDA TDR Portal — Workflow & Architecture', {
  x: 0.6,
  y: 3.1,
  w: 8.8,
  h: 0.7,
  fontSize: 18,
  color: 'CBD5E1',
  align: 'center',
  fontFace: 'Calibri',
});
finalSlide.addText('Questions & Discussion', {
  x: 0.6,
  y: 4.0,
  w: 8.8,
  h: 0.5,
  fontSize: 15,
  color: C.gold,
  align: 'center',
  fontFace: 'Calibri',
  italic: true,
});

// ── Write ─────────────────────────────────────────────────────────────────
mkdirSync(join(__dirname, '..', 'docs'), { recursive: true });
await pres.writeFile({ fileName: OUTPUT });
console.log(`✅ Presentation saved to: ${OUTPUT}`);
console.log(`   Total slides: ${pres.slides.length}`);
