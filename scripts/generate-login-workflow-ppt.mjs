/**
 * Generates APCRDA TDR Portal — Login Workflows presentation.
 * Run: npm run ppt:login
 */
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'docs', 'APCRDA-TDR-Portal-Login-Workflows.pptx');

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
pres.subject = 'TDR Portal Login Workflows';
pres.title = 'APCRDA TDR Portal — Login Workflows';
pres.layout = 'LAYOUT_16x9';

let slideNum = 0;

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
  s.addText(`APCRDA TDR Portal — Login Workflows  |  ${slideNum}`, {
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
  s.background = { color: C.teal };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: L.slideH, fill: { color: C.gold } });
  s.addText(String(num).padStart(2, '0'), {
    x: 0.45,
    y: 1.4,
    w: 2,
    h: 1.2,
    fontSize: 64,
    bold: true,
    color: '99F6E4',
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
  const maxRows = opts.maxRows ?? 8;
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
  const colors = [C.teal, C.blue, C.green, C.gold, C.purple, C.navy];

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

function addRoleWorkflowSlide(role) {
  addContentSlide(
    `${role.title} — Login to Next Task`,
    [
      { text: 'Login', bold: true, color: C.blue },
      `URL: /official-login → email + password (or NIC SSO)`,
      `Demo: ${role.email} / Test@123`,
      { text: 'After Login', bold: true, color: C.teal },
      `Redirect: ${role.dashboard}`,
      `Queue: bonds at status ${role.queueStatus}`,
      { text: 'Your Task on Dashboard', bold: true, color: C.green },
      ...role.tasks,
      { text: 'Next Stage Holder', bold: true, color: C.gold },
      role.nextStage,
      ...(role.extra || []),
    ],
    { maxItems: 7, fontSize: 12 },
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TITLE & AGENDA
// ══════════════════════════════════════════════════════════════════════════
addTitleSlide(
  'APCRDA TDR Portal',
  'Login Workflows — Farmer & Official Roles\nStep-by-step from login screen to next task',
);

addContentSlide(
  'Agenda',
  [
    { text: '1. Two Login Portals — Farmer vs Official', bold: true },
    { text: '2. Farmer Login — Full OTP Workflow', bold: true, color: C.teal },
    { text: '3. Farmer — After Login Tasks', bold: true, color: C.teal },
    { text: '4. Official Login — Email/Password & SSO', bold: true, color: C.blue },
    { text: '5. DEO / Surveyor — Login → Intake Review', bold: true },
    { text: '6. Tahsildar → SDC → Director → Commissioner', bold: true },
    { text: '7. Role Summary Table & Demo Credentials', bold: true },
    { text: '8. Session Security, Middleware & Logout', bold: true },
  ],
  { maxItems: 8, fontSize: 13 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 01 — OVERVIEW
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Two Login Portals', 1);

addTwoColSlide(
  'Farmer vs Official Login',
  {
    title: 'Citizen (Farmer) Portal',
    bullets: [
      { text: 'URL: /farmer-login', bold: true },
      'Aadhaar-linked mobile number',
      'OTP verification (no password)',
      'HMAC citizen_session cookie',
      'No Supabase account needed',
      'Redirect: /farmer/dashboard',
    ],
  },
  {
    title: 'Official (Government) Portal',
    bullets: [
      { text: 'URL: /official-login', bold: true },
      'Email + password (Supabase Auth)',
      'Optional NIC Google SSO',
      'JWT with role in app_metadata',
      '5 approval roles (DEO → Commissioner)',
      'Redirect: role-based dashboard',
    ],
  },
);

addTableSlide(
  'Login Entry Points',
  ['User Type', 'Login Page', 'Auth Method', 'Landing Page'],
  [
    ['Farmer / Citizen', '/farmer-login', 'OTP on registered phone', '/farmer/dashboard'],
    ['DEO / Surveyor', '/official-login', 'Email + password / SSO', '/deo/dashboard'],
    ['Tahsildar (L1)', '/official-login', 'Email + password / SSO', '/official/dashboard'],
    ['SDC (L2)', '/official-login', 'Email + password / SSO', '/official/dashboard'],
    ['Director Lands (L3)', '/official-login', 'Email + password / SSO', '/official/dashboard'],
    ['Commissioner (L4)', '/official-login', 'Email + password / SSO', '/official/dashboard'],
  ],
  [1.5, 1.8, 2.5, 2.3],
  { fontSize: 9, rowH: 0.36 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 02 — FARMER LOGIN
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Farmer Login Workflow', 2);

addFlowSlide(
  'Farmer Login — End-to-End Flow',
  [
    'Open\n/farmer-login',
    'Enter 10-digit\nmobile',
    'Send OTP\n(API request)',
    'Enter 6-digit\nOTP',
    'Verify OTP\n(API verify)',
    'citizen_session\ncookie set',
    '/farmer/\ndashboard',
  ],
  'Phone must match a registered farmer (aadhaarPhone in database)',
);

addContentSlide(
  'Farmer Login — Step-by-Step Detail',
  [
    { text: 'Step 1 — Enter mobile number', bold: true },
    'User opens /farmer-login and enters Aadhaar-linked 10-digit mobile',
    { text: 'Step 2 — Request OTP', bold: true },
    'POST /api/auth/otp/request → lookup farmer by aadhaarPhone',
    'If no farmer found: "No TDR exists linked to this phone number"',
    { text: 'Step 3 — Verify OTP', bold: true },
    'POST /api/auth/otp/verify → verifyFarmerLoginOtp() → sign out any Supabase session',
    'Sets HMAC-signed citizen_session cookie + last_active cookie',
    { text: 'Step 4 — Redirect', bold: true },
    'Browser navigates to /farmer/dashboard; middleware validates citizen_session',
  ],
  { maxItems: 7, fontSize: 12 },
);

addContentSlide(
  'Farmer — After Login: What You Can Do',
  [
    { text: 'Dashboard (/farmer/dashboard)', bold: true, color: C.teal },
    'View all TDR bonds linked to your farmer account',
    'See status tracker: DRAFT → L1 → L2 → L3 → L4 → ACTIVE',
    { text: 'When bond is ACTIVE', bold: true, color: C.green },
    'Open /farmer/certificates/[id] → View & Download PDF certificate',
    { text: 'Public verification (no login)', bold: true },
    'Anyone can verify at /verify/[tdrNumber] using QR on certificate',
    { text: 'Note: Farmers do not submit bonds in-app', color: C.gray },
    'Bonds are synced by DEO from external APCRDA records',
  ],
  { maxItems: 7, fontSize: 12 },
);

addContentSlide(
  'Farmer — Session & Security',
  [
    { text: 'Session cookie: citizen_session', bold: true },
    'HMAC-SHA256 signed · 30-minute expiry · httpOnly',
    { text: 'Idle timeout: 30 minutes', bold: true },
    'last_active cookie checked by middleware → redirect to /farmer-login?reason=idle',
    { text: 'Protected routes', bold: true },
    '/farmer/* · /api/bonds/farmer/* · /api/dashboard/farmer',
    { text: 'Logout: POST /api/auth/logout', bold: true },
    'Clears citizen_session + last_active · Audit: LOGOUT',
    { text: 'Demo credentials', color: C.gray },
    'Phone: 9666666666 · OTP: any 6 digits (e.g. 123456) · Padmavathi / TDR-2025-004',
  ],
  { maxItems: 7, fontSize: 12 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 03 — OFFICIAL LOGIN
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Official Login Workflow', 3);

addFlowSlide(
  'Official Login — End-to-End Flow',
  [
    'Open\n/official-login',
    'Email +\nPassword',
    'POST /api/auth/\nofficial/login',
    'Supabase\nsignIn',
    'Resolve role\nfrom JWT/DB',
    'Set session +\nlast_active',
    'Role-based\ndashboard',
  ],
  'All 5 approval roles use the same login page; redirect differs by role',
);

addContentSlide(
  'Official Login — Step-by-Step Detail',
  [
    { text: 'Step 1 — Enter credentials', bold: true },
    'Email (e.g. deo001@apcrda.org) + password (min 8 chars) on /official-login',
    { text: 'Step 2 — Authenticate via Supabase', bold: true },
    'POST /api/auth/official/login → signInWithPassword()',
    { text: 'Step 3 — Role resolution', bold: true },
    'Read app_metadata.role from JWT; fallback to officials table (must be isActive)',
    'Reject if not an official role → sign out + error',
    { text: 'Step 4 — Redirect by role', bold: true },
    'DEO/SURVEYOR → /deo/dashboard · All other officials → /official/dashboard',
    { text: 'Optional: NIC SSO', color: C.gray },
    'GET /api/auth/official/sso → Google OAuth → /auth/callback → dashboard',
  ],
  { maxItems: 7, fontSize: 12 },
);

addFlowSlide(
  'Approval Chain — Who Handles What After Login',
  [
    'DRAFT\n(DEO reviews)',
    'PENDING_L1\n(Tahsildar)',
    'PENDING_L2\n(SDC)',
    'PENDING_L3\n(Director)',
    'PENDING_L4\n(Commissioner)',
    'ACTIVE\n(Certificate)',
  ],
  'Each official sees only bonds at their queue status in their district',
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 04 — PER-ROLE WORKFLOWS
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Per-Role Login & Tasks', 4);

addRoleWorkflowSlide({
  title: 'DEO / Surveyor (Level 1 — Intake)',
  email: 'deo001@apcrda.org',
  dashboard: '/deo/dashboard',
  queueStatus: 'DRAFT',
  tasks: [
    'Review synced bond records (holder, land, 5 documents)',
    'Open /deo/bonds/[id]/review → BondReviewPanel',
    'Approve → bond moves to PENDING_L1 (enters approval pipeline)',
    'Reject → bond status REJECTED (terminal at intake)',
  ],
  nextStage: 'After DEO Approve → Tahsildar (L1) reviews at PENDING_L1',
});

addRoleWorkflowSlide({
  title: 'Tahsildar / Dy. Tahsildar (Level 2 — L1)',
  email: 'tah001@apcrda.org',
  dashboard: '/official/dashboard',
  queueStatus: 'PENDING_L1',
  tasks: [
    'Dashboard shows bonds awaiting L1 approval in your district',
    'Open /official/bonds/[id]/review',
    'Approve → PENDING_L2 | Reject → REJECTED | Return → DRAFT (back to DEO)',
  ],
  nextStage: 'After L1 Approve → SDC (L2) reviews at PENDING_L2',
});

addRoleWorkflowSlide({
  title: 'SDC (Level 3 — L2)',
  email: 'sdc001@apcrda.org',
  dashboard: '/official/dashboard',
  queueStatus: 'PENDING_L2',
  tasks: [
    'Queue: bonds at PENDING_L2 in your district',
    'Review bond details and approval history',
    'Approve → PENDING_L3 | Reject → REJECTED | Return → DRAFT',
  ],
  nextStage: 'After L2 Approve → Director Lands (L3) at PENDING_L3',
});

addRoleWorkflowSlide({
  title: 'Director Lands (Level 4 — L3)',
  email: 'dir001@apcrda.org',
  dashboard: '/official/dashboard',
  queueStatus: 'PENDING_L3',
  tasks: [
    'Queue: bonds at PENDING_L3 in your district',
    'Review full bond package before final stages',
    'Approve → PENDING_L4 | Reject → REJECTED | Return → DRAFT',
  ],
  nextStage: 'After L3 Approve → Commissioner (L4) at PENDING_L4',
});

addRoleWorkflowSlide({
  title: 'Commissioner / Addl. Commissioner (Level 5 — L4)',
  email: 'com001@apcrda.org',
  dashboard: '/official/dashboard',
  queueStatus: 'PENDING_L4',
  tasks: [
    'Queue: bonds at PENDING_L4 — final approval stage',
    'Approve → ACTIVE + certificate minted (PDF + QR + blockchain)',
    'Reject → REJECTED (no return option at L4)',
    'Can also Revoke an ACTIVE bond → REVOKED',
  ],
  nextStage: 'After L4 Approve → Farmer can download certificate from /farmer/dashboard',
  extra: [
    { text: 'Farmer notified indirectly', color: C.gray },
    'Bond status becomes ACTIVE; farmer sees certificate on next login',
  ],
});

addTableSlide(
  'Complete Role Summary — Login to Next Task',
  ['Role', 'Login', 'Dashboard', 'Queue', 'Action', 'Next Holder'],
  [
    [
      'DEO / Surveyor',
      '/official-login',
      '/deo/dashboard',
      'DRAFT',
      'Approve / Reject',
      'Tahsildar (L1)',
    ],
    [
      'Tahsildar',
      '/official-login',
      '/official/dashboard',
      'PENDING_L1',
      'Approve / Reject / Return',
      'SDC (L2)',
    ],
    [
      'SDC',
      '/official-login',
      '/official/dashboard',
      'PENDING_L2',
      'Approve / Reject / Return',
      'Director (L3)',
    ],
    [
      'Director Lands',
      '/official-login',
      '/official/dashboard',
      'PENDING_L3',
      'Approve / Reject / Return',
      'Commissioner (L4)',
    ],
    [
      'Commissioner',
      '/official-login',
      '/official/dashboard',
      'PENDING_L4',
      'Approve / Reject',
      'Farmer (certificate)',
    ],
    ['Farmer', '/farmer-login', '/farmer/dashboard', 'All own bonds', 'View / Download cert', '—'],
  ],
  [1.3, 1.2, 1.5, 1.1, 1.5, 1.5],
  { fontSize: 8, rowH: 0.36 },
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 05 — SECURITY & DEMO
// ══════════════════════════════════════════════════════════════════════════
addSectionSlide('Security & Demo Access', 5);

addContentSlide(
  'Middleware — Route Protection After Login',
  [
    { text: 'Public routes (no login)', bold: true },
    '/, /farmer-login, /official-login, /verify, /tdr-bank, /calculator, /status',
    { text: 'Farmer routes (citizen_session required)', bold: true },
    '/farmer/* · middleware checks HMAC cookie · 30-min idle timeout',
    { text: 'Official routes (Supabase JWT required)', bold: true },
    '/deo/* → DEO or SURVEYOR only · /official/* → all official roles',
    { text: 'Unauthorized access', bold: true },
    'Wrong role → redirect /official-login?reason=unauthorized',
    { text: 'Session refresh', bold: true },
    'last_active cookie updated on each request (maxAge 1800 sec)',
  ],
  { maxItems: 6, fontSize: 12 },
);

addTableSlide(
  'Demo Login Credentials',
  ['Role', 'Email / Phone', 'Password / OTP', 'After Login'],
  [
    ['Farmer (Padmavathi)', '9666666666', 'Any 6-digit OTP (123456)', '/farmer/dashboard'],
    ['DEO', 'deo001@apcrda.org', 'Test@123', '/deo/dashboard'],
    ['Tahsildar', 'tah001@apcrda.org', 'Test@123', '/official/dashboard'],
    ['SDC', 'sdc001@apcrda.org', 'Test@123', '/official/dashboard'],
    ['Director Lands', 'dir001@apcrda.org', 'Test@123', '/official/dashboard'],
    ['Commissioner', 'com001@apcrda.org', 'Test@123', '/official/dashboard'],
  ],
  [1.4, 2.2, 2.0, 2.5],
  { fontSize: 9, rowH: 0.36 },
);

addContentSlide(
  'Logout & Re-Login',
  [
    { text: 'Logout', bold: true },
    'POST /api/auth/logout — clears citizen_session (farmer) or Supabase session (official)',
    'Deletes last_active cookie · writes LOGOUT audit event',
    { text: 'Session expired (idle)', bold: true },
    'After 30 min inactivity → auto-redirect to login with ?reason=idle banner',
    { text: 'Re-login', bold: true },
    'Farmer: same OTP flow · Official: same email/password on /official-login',
    { text: 'Setup note', color: C.gray },
    'Run npm run db:seed then npm run auth:sync before testing official logins',
  ],
  { maxItems: 6, fontSize: 12 },
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
finalSlide.addText('APCRDA TDR Portal — Login Workflows', {
  x: 0.6,
  y: 3.1,
  w: 8.8,
  h: 0.7,
  fontSize: 18,
  color: 'CBD5E1',
  align: 'center',
  fontFace: 'Calibri',
});
finalSlide.addText('Farmer OTP · Official Email · DEO → Commissioner Chain', {
  x: 0.6,
  y: 4.0,
  w: 8.8,
  h: 0.5,
  fontSize: 14,
  color: C.gold,
  align: 'center',
  fontFace: 'Calibri',
  italic: true,
});

mkdirSync(join(__dirname, '..', 'docs'), { recursive: true });
await pres.writeFile({ fileName: OUTPUT });
console.log(`✅ Presentation saved to: ${OUTPUT}`);
console.log(`   Total slides: ${pres.slides.length}`);
