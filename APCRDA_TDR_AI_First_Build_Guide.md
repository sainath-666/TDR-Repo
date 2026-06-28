# APCRDA Offline TDR Bond Migration — Complete Build Guide

> **Stack:** Next.js 14 · TypeScript · Supabase Auth · Cerbos · Prisma · PostgreSQL · Hyperledger Fabric 2.5 · PDFKit
> **Auth:** Supabase (identity, OTP, NIC SSO, JWT issuance, sessions)
> **Authz:** Cerbos PDP (YAML policy-as-code, ALLOW/DENY per action, built-in audit log)
> **Auditing:** Cerbos decision logs + hash-chained audit_log + Fabric ledger (three layers)
> **Team:** 2 TypeScript developers + 1 Fabric specialist (part-time from Week 7)
> **Delivery:** 10 weeks

---

## How the three security layers work together

```
BROWSER / CLIENT
      │  JWT from Supabase (who you are)
      ▼
NEXT.JS MIDDLEWARE
      ├─ Supabase: is the JWT valid and not expired?
      ├─ Session refresh (silent — updates cookie automatically)
      └─ Idle timeout: 30 min inactivity → redirect to login
      │
      ▼
NEXT.JS API ROUTE
      ├─ getCurrentUser() → extracts role, districtCode, farmerId from JWT claims
      ├─ Validate input with Zod
      ├─ withCerbos(user, resource, action) → calls Cerbos PDP
      │       ├─ DENY: return 403 + write CERBOS_DENY to audit_log
      │       └─ ALLOW: store cerbosCallId, continue
      ├─ Business logic + Prisma (PostgreSQL RLS as last-mile row filter)
      ├─ Fabric Gateway write (on state changes)
      └─ writeAuditLog({ ..., cerbosCallId, fabricTxId })
      │
THREE AUDIT TRAILS (all must agree on any bond action):
  1. Cerbos decision log  — every allow/deny, policy name, inputs, timestamp
  2. audit_log table      — every state change, hash-chained, append-only
  3. Fabric ledger        — every approval + certificate mint, immutable
```

**Incident investigation:** query all three by `cerbosCallId` (joins trails 1+2) and `fabricTxId` (joins trails 2+3). Any discrepancy = potential tampering.

---

## Table of contents

1. [Project scope](#1-project-scope)
2. [Repository setup](#2-repository-setup)
3. [Bond status state machine](#3-bond-status-state-machine)
4. [Supabase — authentication](#4-supabase--authentication)
5. [Cerbos — authorisation](#5-cerbos--authorisation)
6. [Prisma schema](#6-prisma-schema)
7. [Next.js scaffold and middleware](#7-nextjs-scaffold-and-middleware)
8. [Security modules](#8-security-modules)
9. [Hyperledger Fabric network](#9-hyperledger-fabric-network)
10. [API routes — all 32 endpoints](#10-api-routes--all-32-endpoints)
11. [APCRDA system integrations](#11-apcrda-system-integrations)
12. [DEO portal — 3-phase data entry](#12-deo-portal--3-phase-data-entry)
13. [Official portal — approval chain](#13-official-portal--approval-chain)
14. [Farmer PWA](#14-farmer-pwa)
15. [Certificate generation and digital signing](#15-certificate-generation-and-digital-signing)
16. [Telugu internationalisation](#16-telugu-internationalisation)
17. [Supabase Realtime](#17-supabase-realtime)
18. [Error handling and resilience](#18-error-handling-and-resilience)
19. [Testing strategy](#19-testing-strategy)
20. [Deployment](#20-deployment)
21. [Git workflow and branching](#21-git-workflow-and-branching)
22. [Monitoring and alerting](#22-monitoring-and-alerting)
23. [Operational procedures](#23-operational-procedures)
24. [Week-by-week activity plan](#24-week-by-week-activity-plan)
25. [AI prompt library](#25-ai-prompt-library)
26. [Appendix A — Debugging patterns](#appendix-a--debugging-patterns)
27. [Appendix B — Complete file structure](#appendix-b--complete-file-structure)
28. [Appendix C — Pre-launch checklist](#appendix-c--pre-launch-checklist)

---

## 1. Project scope

**Source document:** Procedure for Offline TDR Validation in Online Portal — Capital City
(MAU61-DP0AMRV(OTH)/26/2025-DP I/3971518/2025)

### What this platform delivers

- Capture of offline TDR bonds in **3 phases**: holder address (10 fields), land surrendered (7 fields), document upload (5 types)
- **5-level validation chain**: DEO/Surveyor → Dy. Tahsildar/Tahsildar → SDC → Director (Lands) → Addl. Commissioner/Commissioner
- **Farmer self-activation**: OTP login via Aadhaar-linked phone after certificate is issued
- **Certificate generation**: PDF digitally signed by Commissioner, downloadable via OTP
- **Three portals**: DEO data entry, Government Official approval chain, Farmer PWA (Telugu + English)

### TDR data units — non-negotiable

| Field | Unit | Note |
|---|---|---|
| Land area | **Sq Yards** | Never sq meters — per LPS rules |
| TDR issued extent | **Sq Yards** | Matches land area or authority-adjusted |
| TDR ratio | **String** e.g. `"1:1"` | Authority-decided — **never computed** by system |

---

## 2. Repository setup

### Prerequisites

```bash
node --version   # 20.x LTS
npm --version    # 10.x
docker --version # 24.x
git --version    # any recent
```

Install [Cursor IDE](https://cursor.sh) — every section in this guide includes Cursor prompts you paste directly.

### Create project

```bash
npx create-next-app@14 apcrda-tdr \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*"
cd apcrda-tdr
```

### Install all dependencies

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Cerbos (authorization PDP)
npm install @cerbos/grpc @cerbos/core

# Database ORM
npm install prisma @prisma/client
npm install -D prisma

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# PDF + QR code
npm install pdfkit
npm install -D @types/pdfkit
npm install qrcode
npm install -D @types/qrcode

# File upload
npm install formidable
npm install -D @types/formidable

# Hyperledger Fabric
npm install @hyperledger/fabric-gateway @grpc/grpc-js

# i18n (Telugu + English)
npm install next-i18next react-i18next i18next

# PWA
npm install next-pwa

# UI utilities
npm install clsx tailwind-merge lucide-react

# Dev tools
npm install -D tsx concurrently
```

### Config files

**`tsconfig.json`** — strict mode enforced:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**`.eslintrc.json`**:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**`.prettierrc`**:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**`.cursorrules`** — place in project root. Cursor reads this on every prompt:

```
You are an AI assistant building the APCRDA Offline TDR Bond Migration Platform.

STACK: Next.js 14 App Router, TypeScript strict, Supabase Auth, Cerbos PDP,
Prisma, PostgreSQL, Hyperledger Fabric 2.5, PDFKit.

DOMAIN RULES — never violate:
- TDR area unit is Sq Yards (NEVER sq meters)
- TDR ratio is a string like "1:1" — authority-decided, NEVER computed by system
- Aadhaar: store ONLY as SHA-256 hash OR AES-256-GCM encrypted. NEVER plaintext.
- 5-level approval: L1=DEO/Surveyor, L2=Dy.Tahsildar/Tahsildar, L3=SDC,
  L4=Director Lands, L5=Commissioner/Addl.Commissioner

AUTH + AUTHZ SPLIT (strict):
- Supabase Auth = identity only (OTP, NIC SSO, JWT issuance, session management)
- Cerbos PDP = every permission check (YAML policies, ALLOW/DENY, built-in audit log)
- NEVER hardcode if(role==='SDC') checks in route code — always call withCerbos()
- Supabase RLS = last-mile DB row filter using auth.uid() from Supabase JWT

THREE-LAYER AUDITING (all required on every state change):
- Cerbos logs every allow/deny decision automatically (store cerbosCallId)
- writeAuditLog() called after every bond state change or approval action
- fabricTxId stored in every DB record that has an on-chain counterpart
- Add // AUDIT: comment above every writeAuditLog() call explaining what is logged

CODE RULES:
- Never use `any` — use `unknown` and narrow
- All routes wrapped in withErrorHandling() from @/lib/errors
- All input validated with Zod schemas in @/lib/validations/
- Multi-table writes always in withTransaction() from @/lib/prisma
- Never log full phone numbers, Aadhaar numbers, or JWT tokens
```

### Environment variables

```bash
# .env.local — NEVER commit this file

# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-only — bypasses RLS

# ── Database (Supabase PostgreSQL) ────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:[pw]@db.your-project.supabase.co:5432/postgres

# ── Cerbos PDP ────────────────────────────────────────────────────────────────
CERBOS_PDP_URL=localhost:3593           # gRPC address
CERBOS_PDP_TLS=false                    # true in production
CERBOS_ADMIN_USER=cerbos-admin
CERBOS_ADMIN_PASSWORD=change-in-prod

# ── Hyperledger Fabric ────────────────────────────────────────────────────────
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_MSP_ID=APCRDA
FABRIC_CERT_PATH=./fabric/network/crypto-config/peerOrgs/apcrda/users/Admin/msp/signcerts/Admin-cert.pem
FABRIC_KEY_PATH=./fabric/network/crypto-config/peerOrgs/apcrda/users/Admin/msp/keystore/priv_sk
FABRIC_TLS_CERT_PATH=./fabric/network/crypto-config/peerOrgs/apcrda/peers/peer0.apcrda/tls/ca.crt

# ── Security ──────────────────────────────────────────────────────────────────
HMAC_SECRET=replace-with-32-byte-random-hex         # openssl rand -hex 32
AADHAAR_ENCRYPTION_KEY=replace-with-32-byte-hex     # openssl rand -hex 32
COMMISSIONER_CERT_PATH=./certs/commissioner.crt     # for PDF signing
COMMISSIONER_KEY_PATH=./certs/commissioner.key

# ── SMS (MSG91) ───────────────────────────────────────────────────────────────
MSG91_AUTH_KEY=your-msg91-key
MSG91_SENDER_ID=APCRDA
MSG91_TEMPLATE_ID=your-otp-template-id

# ── APCRDA existing systems ───────────────────────────────────────────────────
APCRDA_LAND_RECORDS_URL=https://landrec.apcrda.ap.gov.in/api
APCRDA_GIS_URL=https://gis.apcrda.ap.gov.in
APCRDA_FARMER_URL=https://farmer.apcrda.ap.gov.in/api
APCRDA_OAUTH_TOKEN_URL=https://auth.apcrda.ap.gov.in/oauth/token
APCRDA_CLIENT_ID=tdr_platform
APCRDA_CLIENT_SECRET=your-client-secret
APCRDA_MOCK_MODE=true          # set false when real APCRDA APIs are available

# ── IPFS ──────────────────────────────────────────────────────────────────────
IPFS_API_URL=http://localhost:5001
```

Copy to `.env.example` with placeholder values — commit `.env.example`, gitignore `.env.local`.

### Project structure

```
apcrda-tdr/
├── .cursorrules
├── .env.example
├── .eslintrc.json / .prettierrc / tsconfig.json
├── next.config.js               ← PWA + security headers + CORS
├── next-i18next.config.js
├── docker-compose.yml
├── Dockerfile
│
├── cerbos/
│   ├── config.yaml              ← audit log, gRPC, hot-reload
│   └── policies/
│       ├── derived_roles.yaml   ← l1_approver, l2_approver, bond_owner_farmer...
│       ├── resource_bond.yaml
│       ├── resource_approval.yaml
│       ├── resource_certificate.yaml
│       ├── resource_document.yaml
│       └── __tests__/bond_tests.yaml
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── fabric/
│   ├── network/
│   │   ├── crypto-config.yaml / configtx.yaml / docker-compose.yml
│   ├── chaincode/tdr-bond-cc/index.js
│   └── scripts/bootstrap.sh / deploy-chaincode.sh
│
├── public/
│   ├── locales/en/common.json
│   ├── locales/te/common.json
│   └── manifest.json
│
├── scripts/
│   ├── bulk-import.ts
│   ├── pre-launch-check.sh
│   └── setup-production.sh
│
├── monitoring/prometheus.yml
├── prompts/                     ← version-controlled AI prompt templates
│
└── src/
    ├── app/
    │   ├── (auth)/farmer-login/page.tsx
    │   ├── (auth)/official-login/page.tsx
    │   ├── (farmer)/dashboard/page.tsx
    │   ├── (farmer)/bonds/[id]/page.tsx
    │   ├── (farmer)/certificates/[id]/page.tsx
    │   ├── (deo)/dashboard/page.tsx
    │   ├── (deo)/bonds/new/page.tsx
    │   ├── (official)/queue/page.tsx
    │   ├── (official)/bonds/[id]/review/page.tsx
    │   ├── verify/[tdrNumber]/page.tsx     ← public QR verification
    │   └── api/                            ← all 32 routes (Section 10)
    │
    ├── components/
    │   ├── ui/LanguageToggle.tsx
    │   ├── ui/ErrorBoundary.tsx
    │   ├── bond-form/BondEntryForm.tsx     ← 3-phase wrapper
    │   ├── bond-form/Phase1HolderForm.tsx
    │   ├── bond-form/Phase2LandForm.tsx
    │   ├── bond-form/DocumentUploadPhase.tsx
    │   ├── approval/ApprovalQueue.tsx
    │   ├── approval/BondReviewPanel.tsx
    │   ├── approval/ApprovalModal.tsx      ← OTP flow
    │   ├── approval/RealtimeQueue.tsx
    │   └── farmer/BondStatusTracker.tsx
    │
    ├── lib/
    │   ├── supabase/client.ts              ← browser/server/admin clients
    │   ├── cerbos/client.ts                ← Cerbos gRPC singleton
    │   ├── cerbos/enforce.ts               ← withCerbos() helper
    │   ├── fabric/gateway.ts
    │   ├── pdf/certificate.ts
    │   ├── integrations/apcrda-adapter.ts
    │   ├── integrations/fixtures/          ← mock data (APCRDA_MOCK_MODE=true)
    │   ├── security/hmac.ts
    │   ├── audit.ts                        ← hash-chained audit_log writer
    │   ├── errors.ts
    │   ├── api-response.ts
    │   ├── logger.ts
    │   ├── prisma.ts
    │   └── validations/bond.ts / approval.ts
    │
    ├── types/index.ts
    └── middleware.ts
```

---

## 3. Bond status state machine

Single source of truth for all status transitions. Cerbos policies, route handlers, Fabric chaincode, and tests all reference this table.

```
DRAFT
  │ DEO submits (all 5 docs present)
  ▼
PENDING_L1  ←── Dy. Tahsildar / Tahsildar queue
  │  APPROVED → PENDING_L2
  │  REJECTED → REJECTED (terminal)
  │  RETURNED → DRAFT
  ▼
PENDING_L2  ←── SDC queue
  │  APPROVED → PENDING_L3
  │  REJECTED → REJECTED
  │  RETURNED → DRAFT
  ▼
PENDING_L3  ←── Director (Lands) queue
  │  APPROVED → PENDING_L4
  │  REJECTED → REJECTED
  │  RETURNED → DRAFT
  ▼
PENDING_L4  ←── Commissioner / Addl. Commissioner queue
  │  APPROVED → certificate auto-generated → ACTIVE
  │  REJECTED → REJECTED
  │  (no RETURN at final level)
  ▼
ACTIVE      ←── farmer can login and download certificate
  │ admin revoke (Commissioner only, fraud/court order)
  ▼
REVOKED     ←── terminal
```

**Valid transitions** (any other = code bug caught by Cerbos or route validation):

| From | Event | To | Authorised role |
|---|---|---|---|
| DRAFT | submit | PENDING_L1 | DEO, SURVEYOR |
| PENDING_L1 | approve | PENDING_L2 | DY_TAHSILDAR, TAHSILDAR |
| PENDING_L1 | reject | REJECTED | DY_TAHSILDAR, TAHSILDAR |
| PENDING_L1 | return | DRAFT | DY_TAHSILDAR, TAHSILDAR |
| PENDING_L2 | approve | PENDING_L3 | SDC |
| PENDING_L2 | reject | REJECTED | SDC |
| PENDING_L2 | return | DRAFT | SDC |
| PENDING_L3 | approve | PENDING_L4 | DIRECTOR_LANDS |
| PENDING_L3 | reject | REJECTED | DIRECTOR_LANDS |
| PENDING_L3 | return | DRAFT | DIRECTOR_LANDS |
| PENDING_L4 | approve | ACTIVE | COMMISSIONER, ADDL_COMMISSIONER |
| PENDING_L4 | reject | REJECTED | COMMISSIONER, ADDL_COMMISSIONER |
| ACTIVE | revoke | REVOKED | COMMISSIONER only |

---

## 4. Supabase — authentication

Supabase handles **identity only** — who you are. What you can do is Cerbos's responsibility.

### Project setup

1. [supabase.com](https://supabase.com) → New project → region: `ap-southeast-1`
2. Copy URL and anon key to `.env.local`

### Enable Phone Auth (farmer OTP)

Dashboard → Authentication → Providers → Phone → Enable
SMS provider: Custom (MSG91):

```
https://api.msg91.com/api/v5/otp?template_id=TEMPLATE&mobile={{number}}&authkey=KEY&otp={{otp}}
```

### Configure NIC SSO (official login)

Dashboard → Authentication → SSO Providers → Add provider → Custom OIDC
Obtain client ID and secret from NIC IT team.

### Auth Hook — injects APCRDA claims into JWT

**Cursor prompt** → `supabase/migrations/001_auth_hook.sql`:

```
Write a PostgreSQL function for the Supabase custom access token hook.
Name: custom_access_token_hook
Fires after every sign-in. Adds APCRDA role claims to JWT app_metadata.

Logic:
1. Get user id from event->>'userId'
2. Look up officials table: find role, district_code, employee_id
3. If found: set app_metadata claims: role, district_code, employee_id
4. If not found in officials: look up farmers table for farmer_id
5. If found as farmer: set role='FARMER', farmer_id
6. If neither: return event unchanged (new user, not yet assigned)
Return modified JSONB event.

SECURITY DEFINER. Accept JSONB. Return JSONB.
Grant EXECUTE to supabase_auth_admin only.

Roles: DEO | SURVEYOR | DY_TAHSILDAR | TAHSILDAR | SDC |
       DIRECTOR_LANDS | ADDL_COMMISSIONER | COMMISSIONER | FARMER
```

Register: Dashboard → Authentication → Hooks → Custom Access Token.

### Supabase client helpers

**Cursor prompt** → `src/lib/supabase/client.ts`:

```
Write Supabase clients for Next.js 14 App Router.
1. createBrowserClient() — React Client Components, NEXT_PUBLIC_ keys
2. createServerClient() — Server Components/API routes, reads next/headers cookies,
   auto-refreshes session
3. createAdminClient() — server-only, SUPABASE_SERVICE_ROLE_KEY,
   bypasses RLS — ONLY for user management and audit_log writes

Also export getCurrentUser(cookieStore) that:
- Gets Supabase session via server client
- Extracts custom claims from JWT app_metadata:
  role, district_code, employee_id, farmer_id
- Returns typed CurrentUser or null if unauthenticated/expired
CurrentUser type: { id, role, districtCode?, employeeId?, farmerId? }
```

### Supabase Storage bucket setup

Run in Supabase SQL editor:

```sql
-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('tdr-documents',    'tdr-documents',    false, 10485760,
   ARRAY['application/pdf','image/jpeg','image/png']),
  ('tdr-certificates', 'tdr-certificates', false, 5242880,
   ARRAY['application/pdf']);

-- Officials can upload documents
CREATE POLICY "officials_upload_documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tdr-documents'
  AND (auth.jwt()->'app_metadata'->>'role') IN
      ('DEO','SURVEYOR','SDC','DIRECTOR_LANDS','COMMISSIONER','ADDL_COMMISSIONER')
);

-- Authenticated users can read documents (bond ownership enforced in API route)
CREATE POLICY "authenticated_read_documents" ON storage.objects FOR SELECT
TO authenticated USING (bucket_id = 'tdr-documents');

-- Only service_role writes certificates (triggered by certificate generate route)
CREATE POLICY "service_role_write_certs" ON storage.objects FOR INSERT
TO service_role WITH CHECK (bucket_id = 'tdr-certificates');

-- Authenticated users can read certificates (bond ownership enforced in API route)
CREATE POLICY "authenticated_read_certs" ON storage.objects FOR SELECT
TO authenticated USING (bucket_id = 'tdr-certificates');
```

### Session refresh and idle timeout

**Cursor prompt** → add to `src/middleware.ts`:

```
After validating Supabase session in middleware:
1. Call supabase.auth.getUser() — refreshes access token silently if needed
2. If session expired on a protected route: clear cookie, redirect to appropriate login
3. Idle timeout: read 'last_active' httpOnly cookie.
   If older than 30 minutes and route is protected:
   redirect to login with ?reason=idle (show "Session expired due to inactivity")
4. On every protected request: set/refresh 'last_active' cookie to now()
   (httpOnly, sameSite=strict, path=/, maxAge=1800)
```

---

## 5. Cerbos — authorisation

Cerbos is the **single source of truth for all permissions**. Zero `if (role === 'X')` checks in route code. All authorization logic lives in `cerbos/policies/*.yaml`.

### What Cerbos gives you

- **Policy-as-code**: YAML files, version-controlled in git, change permissions without code deploy
- **Built-in audit log**: every allow/deny recorded with principal, resource, action, policy evaluated, timestamp — **you get authorization auditing for free**
- **sub-millisecond evaluation**: stateless PDP, runs as a Docker sidecar
- **`cerbosCallId`**: every decision has a unique ID — store this in your DB and join it with Cerbos logs during incident investigation

### Run Cerbos PDP

```bash
# Development
docker run --rm --name cerbos \
  -v $(pwd)/cerbos/policies:/policies \
  -v $(pwd)/cerbos/config.yaml:/config.yaml \
  -p 3592:3592 \
  -p 3593:3593 \
  ghcr.io/cerbos/cerbos:0.38.0 \
  server --config=/config.yaml
```

`cerbos/config.yaml`:

```yaml
server:
  httpListenAddr: ":3592"
  grpcListenAddr: ":3593"

storage:
  driver: disk
  disk:
    directory: /policies
    watchForChanges: true   # hot-reload in dev — change YAML, see effect immediately

audit:
  enabled: true
  accessLogsEnabled: true
  decisionLogsEnabled: true   # logs every allow/deny — THIS is your authz audit trail
  backend: local
  local:
    storagePath: /var/log/cerbos
    retentionPeriod: 168h     # 7 days local; forward to Cerbos Hub in production
```

Add to `docker-compose.yml`:

```yaml
cerbos:
  image: ghcr.io/cerbos/cerbos:0.38.0
  command: server --config=/config.yaml
  volumes:
    - ./cerbos/policies:/policies
    - ./cerbos/config.yaml:/config.yaml
    - cerbos_logs:/var/log/cerbos
  ports: ["3592:3592", "3593:3593"]
```

### Cerbos client singleton

**Cursor prompt** → `src/lib/cerbos/client.ts`:

```
Write a Cerbos gRPC client singleton.
Import GRPC from '@cerbos/grpc'.
Read CERBOS_PDP_URL (default 'localhost:3593') and CERBOS_PDP_TLS (boolean).
Production: use TLS credentials. Development: no TLS.
Export getCerbosClient(): GRPC as a singleton (connect once, reuse).
```

### withCerbos enforcement helper

**Cursor prompt** → `src/lib/cerbos/enforce.ts`:

```
Write withCerbos(user, resource, action): Promise<string>
where the return value is the cerbosCallId from the decision.

Steps:
1. Build principal: { id: user.id, roles: [user.role],
   attributes: { districtCode: user.districtCode ?? '' } }
2. Call getCerbosClient().checkResource({ principal, resource, actions: [action] })
3. Store the response callId (cerbosCallId)
4. If result.isAllowed(action) === false:
   - Log warn: "Cerbos DENY: ${user.role} ${action} on ${resource.kind}/${resource.id}"
   - writeAuditLog({ action: 'CERBOS_DENY',
       details: { principal: user.id, role: user.role, resource, action },
       cerbosCallId }) — fire and forget, do not await
   - Throw AuthorizationError(`Not allowed to ${action} on ${resource.kind}`)
5. If allowed: log debug and RETURN the cerbosCallId
   (Cerbos already logged the full decision — we just need to store the ID)

Callers store the returned cerbosCallId in approval_steps and audit_log
for cross-system traceability.
```

### APCRDA TDR Cerbos policies

**`cerbos/policies/derived_roles.yaml`**:

```yaml
---
apiVersion: api.cerbos.dev/v1
description: APCRDA TDR derived roles — level-specific and district-aware
derivedRoles:
  name: apcrda_derived
  definitions:

    - name: bond_owner_farmer
      parentRoles: ["FARMER"]
      condition:
        match:
          expr: request.resource.attr.farmerId == request.principal.id

    - name: same_district_official
      parentRoles: ["DEO","SURVEYOR","DY_TAHSILDAR","TAHSILDAR","SDC","DIRECTOR_LANDS"]
      condition:
        match:
          expr: >
            request.principal.attr.districtCode == request.resource.attr.districtCode

    - name: l1_approver
      parentRoles: ["DY_TAHSILDAR","TAHSILDAR"]
      condition:
        match:
          expr: >
            request.resource.attr.status == "PENDING_L1"
            && request.principal.attr.districtCode == request.resource.attr.districtCode

    - name: l2_approver
      parentRoles: ["SDC"]
      condition:
        match:
          expr: >
            request.resource.attr.status == "PENDING_L2"
            && request.principal.attr.districtCode == request.resource.attr.districtCode

    - name: l3_approver
      parentRoles: ["DIRECTOR_LANDS"]
      condition:
        match:
          expr: >
            request.resource.attr.status == "PENDING_L3"
            && request.principal.attr.districtCode == request.resource.attr.districtCode

    - name: l4_approver
      parentRoles: ["COMMISSIONER","ADDL_COMMISSIONER"]
      condition:
        match:
          expr: request.resource.attr.status == "PENDING_L4"
```

**`cerbos/policies/resource_bond.yaml`**:

```yaml
---
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  importDerivedRoles: [apcrda_derived]
  resource: bond
  rules:
    # DEO/Surveyor can create bonds
    - actions: [create]
      roles: [DEO, SURVEYOR]
      effect: EFFECT_ALLOW

    # DEO can edit/submit their own DRAFT bonds
    - actions: [update, submit]
      roles: [DEO, SURVEYOR]
      condition:
        match:
          expr: request.resource.attr.status == "DRAFT"
      effect: EFFECT_ALLOW

    # Officials in same district can view
    - actions: [view]
      derivedRoles: [same_district_official]
      effect: EFFECT_ALLOW

    # Commissioner sees all districts
    - actions: [view]
      roles: [COMMISSIONER, ADDL_COMMISSIONER]
      effect: EFFECT_ALLOW

    # Farmer sees only their own bonds
    - actions: [view]
      derivedRoles: [bond_owner_farmer]
      effect: EFFECT_ALLOW

    # Document upload: officials on bonds that aren't terminal
    - actions: [upload_document]
      derivedRoles: [same_district_official]
      condition:
        match:
          expr: >
            request.resource.attr.status != "ACTIVE"
            && request.resource.attr.status != "REJECTED"
            && request.resource.attr.status != "REVOKED"
      effect: EFFECT_ALLOW

    # Revoke: Commissioner only, on ACTIVE bonds
    - actions: [revoke]
      roles: [COMMISSIONER]
      condition:
        match:
          expr: request.resource.attr.status == "ACTIVE"
      effect: EFFECT_ALLOW

    - actions: ["*"]
      roles: ["*"]
      effect: EFFECT_DENY
```

**`cerbos/policies/resource_approval.yaml`**:

```yaml
---
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  importDerivedRoles: [apcrda_derived]
  resource: approval
  rules:
    - actions: [approve, reject, return]
      derivedRoles: [l1_approver]
      effect: EFFECT_ALLOW

    - actions: [approve, reject, return]
      derivedRoles: [l2_approver]
      effect: EFFECT_ALLOW

    - actions: [approve, reject, return]
      derivedRoles: [l3_approver]
      effect: EFFECT_ALLOW

    # No return at final level
    - actions: [approve, reject]
      derivedRoles: [l4_approver]
      effect: EFFECT_ALLOW

    - actions: [view]
      derivedRoles: [same_district_official]
      effect: EFFECT_ALLOW

    - actions: [view]
      roles: [COMMISSIONER, ADDL_COMMISSIONER]
      effect: EFFECT_ALLOW

    - actions: ["*"]
      roles: ["*"]
      effect: EFFECT_DENY
```

**`cerbos/policies/resource_certificate.yaml`**:

```yaml
---
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  importDerivedRoles: [apcrda_derived]
  resource: certificate
  rules:
    - actions: [generate]
      roles: [COMMISSIONER, ADDL_COMMISSIONER]
      condition:
        match:
          expr: request.resource.attr.bondStatus == "PENDING_L4"
      effect: EFFECT_ALLOW

    - actions: [download]
      derivedRoles: [bond_owner_farmer]
      condition:
        match:
          expr: request.resource.attr.bondStatus == "ACTIVE"
      effect: EFFECT_ALLOW

    # Public verify — handle in route by NOT calling Cerbos
    - actions: [verify]
      roles: ["*"]
      effect: EFFECT_ALLOW

    - actions: ["*"]
      roles: ["*"]
      effect: EFFECT_DENY
```

### Test Cerbos policies locally

```bash
# Run policy tests (Cerbos built-in test runner)
docker run --rm \
  -v $(pwd)/cerbos/policies:/policies \
  ghcr.io/cerbos/cerbos:0.38.0 compile --tests /policies

# Manual check: can SDC approve PENDING_L2 bond in same district?
docker exec cerbos cerbos decisions check \
  --principal='{"id":"sdc1","roles":["SDC"],"attributes":{"districtCode":"KRISHNA"}}' \
  --resource='{"kind":"approval","id":"b1","attributes":{"status":"PENDING_L2","districtCode":"KRISHNA"}}' \
  --action=approve
# Expected: EFFECT_ALLOW

# Can farmer approve their own bond? (should be DENY)
docker exec cerbos cerbos decisions check \
  --principal='{"id":"f1","roles":["FARMER"]}' \
  --resource='{"kind":"approval","id":"b1","attributes":{"status":"PENDING_L1"}}' \
  --action=approve
# Expected: EFFECT_DENY
```

---

## 6. Prisma schema

**Cursor prompt** → `prisma/schema.prisma`:

```
Write a complete Prisma schema for the APCRDA TDR Bond Migration Platform.
Provider: postgresql (Supabase). Use @@map for snake_case table names.

Tables:

1. tdr_bonds
   id UUID PK, tdr_number VARCHAR UNIQUE NOT NULL, track String (OFFLINE),
   status BondStatus enum (DRAFT PENDING_L1 PENDING_L2 PENDING_L3 PENDING_L4
   ACTIVE REJECTED REVOKED), farmer_id UUID FK → farmers,
   created_by UUID FK → officials, fabric_tx_id String?,
   certificate_ipfs_cid String?, minted_at DateTime?,
   rejection_reason String?, revoked_at DateTime?, revoke_reason String?,
   created_at DateTime, updated_at DateTime
   @@index([status, farmer_id])

2. bond_holders (one per bond)
   id UUID PK, bond_id UUID FK → tdr_bonds (unique — one holder per bond),
   name String, relation_type RelationType (S_O | D_O | W_O),
   relation_name String, aadhaar_hash String NOT NULL (SHA-256),
   aadhaar_encrypted String NOT NULL (AES-256-GCM),
   aadhaar_phone String NOT NULL (10 digits), email String?,
   door_no String, street String, village String, mandal String, district String

3. bond_land_details (one per bond)
   id UUID PK, bond_id UUID FK → tdr_bonds (unique),
   surrendered_village String, survey_number String NOT NULL,
   ownership_deed_no String?, surrendered_area_sq_yds Decimal(12,4),
   tdr_issued_extent_sq_yds Decimal(12,4), issued_ratio String (e.g. "1:1"),
   tdr_certificate_number String?, returnable_plot_code String?

4. bond_documents
   id UUID PK, bond_id UUID FK, doc_type DocumentType enum
   (OWNERSHIP_DOCUMENT AADHAAR_COPY RETURNABLE_PLOT_ALLOTMENT
   TDR_ISSUED_COPY INDIVIDUAL_SKETCH),
   ipfs_cid String, supabase_storage_path String, sha256_hash String,
   file_name String, file_size_kb Int, uploaded_by UUID FK → officials,
   uploaded_at DateTime
   @@index([bond_id])

5. approval_steps (5 per bond — one per level)
   id UUID PK, bond_id UUID FK, level Int (1-5),
   role OfficialRole enum, decision ApprovalDecision enum
   (PENDING APPROVED REJECTED RETURNED),
   official_id UUID FK → officials?,
   signature_hash String? (HMAC-SHA256),
   cerbos_call_id String?  ← JOIN KEY linking to Cerbos decision log
   fabric_tx_id String?, remarks String?, decided_at DateTime?, created_at DateTime
   @@unique([bond_id, level])

6. officials
   id UUID PK (= Supabase auth.uid()), employee_id String UNIQUE,
   name String, role OfficialRole, district_code String,
   phone String (10 digits), is_active Boolean DEFAULT true,
   created_at DateTime, updated_at DateTime

7. farmers
   id UUID PK (= Supabase auth.uid() after OTP activation),
   apcrda_farmer_id String? (from APCRDA Farmer Portal),
   name String, aadhaar_hash String, aadhaar_phone String NOT NULL,
   kyc_verified Boolean DEFAULT false, created_at DateTime, updated_at DateTime
   @@index([aadhaar_phone, aadhaar_hash])

8. audit_log (append-only, hash-chained — NEVER UPDATE OR DELETE)
   id BigInt @id @default(autoincrement())  ← sequential, NOT UUID (for chain ordering)
   bond_id UUID?, actor_id UUID?, actor_role String?, action String NOT NULL,
   details Json?, ip_address String?,
   cerbos_call_id String?  ← JOIN KEY linking to Cerbos decision log
   fabric_tx_id String?,
   chain_hash String NOT NULL,
   created_at DateTime DEFAULT now()
   @@index([bond_id, created_at])

9. otp_requests (approval OTPs — separate from login OTPs)
   id UUID PK, user_id UUID NOT NULL, purpose String (APPROVAL | DOWNLOAD),
   otp_hash String NOT NULL (bcrypt), expires_at DateTime NOT NULL,
   used Boolean DEFAULT false, created_at DateTime

OfficialRole: DEO SURVEYOR DY_TAHSILDAR TAHSILDAR SDC DIRECTOR_LANDS ADDL_COMMISSIONER COMMISSIONER
ApprovalDecision: PENDING APPROVED REJECTED RETURNED
```

### RLS policies (PostgreSQL)

Run in Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE tdr_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bond_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Farmer sees only own bonds (RESTRICTIVE = must pass even if other policies allow)
CREATE POLICY farmer_own_bonds ON tdr_bonds AS RESTRICTIVE FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'role') != 'FARMER'
    OR farmer_id = auth.uid()
  );

-- Officials see only their district's bonds
CREATE POLICY district_isolation ON tdr_bonds FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('COMMISSIONER','ADDL_COMMISSIONER')
    OR (
      SELECT district FROM bond_holders WHERE bond_id = id LIMIT 1
    ) = (auth.jwt()->'app_metadata'->>'district_code')
  );

-- DEO can insert new bonds
CREATE POLICY deo_insert ON tdr_bonds FOR INSERT
  WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') IN ('DEO','SURVEYOR')
    AND created_by = auth.uid()
  );

-- Audit log: no direct user writes (service_role only via admin client)
CREATE POLICY audit_log_no_user_write ON audit_log FOR ALL
  TO authenticated USING (false) WITH CHECK (false);

-- Audit log: users can read (for viewing their own bond history)
CREATE POLICY audit_log_read ON audit_log FOR SELECT
  TO authenticated USING (
    actor_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'role') IN ('COMMISSIONER','ADDL_COMMISSIONER','DIRECTOR_LANDS')
  );
```

Also add DB-level append-only rules:

```sql
CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

### Run migrations and seed

```bash
npx prisma generate
npx prisma db push

# Seed test data (see prompt in Section 2 for seed.ts content)
npx prisma db seed
```

---

## 7. Next.js scaffold and middleware

### TypeScript types

**Cursor prompt** → `src/types/index.ts`:

```
Generate TypeScript types for the APCRDA TDR platform.
BondStatus, ApprovalDecision, OfficialRole, DocumentType, RelationType enums.
TdrBond with nested bond_holders, bond_land_details, bond_documents[], approval_steps[].
BondPhase1 (10 holder fields from procedure doc).
BondPhase2 (7 land fields from procedure doc).
CurrentUser { id, role, districtCode?, employeeId?, farmerId? }
ApiResponse<T> { success, data?, error?, code? }
PaginatedResponse<T> { items, total, page, limit, totalPages }
CerbosResource { kind: string; id: string; attributes?: Record<string, unknown> }
```

### Middleware

**Cursor prompt** → `src/middleware.ts`:

```
Write Next.js 14 App Router middleware for APCRDA TDR.

Public routes (no auth): /farmer-login, /official-login, /api/auth/*,
/api/certificates/*/verify, /api/health, /_next/*, /favicon.ico, /verify/*

For protected routes:
1. Create Supabase server client from request cookies
2. supabase.auth.getUser() — refreshes session silently, updates response cookies
3. If no user: redirect to /farmer-login or /official-login based on URL prefix
4. Extract CurrentUser from JWT app_metadata (note: this reads from Supabase JWT
   which was enriched by the Auth Hook with role, district_code etc.)
5. Idle timeout: read 'last_active' cookie; if > 30 min old, redirect to login
   with ?reason=idle; else update 'last_active' cookie to now()
6. Route guard:
   /farmer/* → role must be FARMER
   /deo/* → role must be DEO or SURVEYOR
   /official/* → role must be any official (not FARMER)
   /commissioner/* → role must be COMMISSIONER or ADDL_COMMISSIONER
   /api/users/* → role must be COMMISSIONER or ADDL_COMMISSIONER

Do NOT call Cerbos from middleware — Cerbos needs full resource context
available only in the individual API routes.
```

---

## 8. Security modules

### HMAC approval signatures + Aadhaar protection

**Cursor prompt** → `src/lib/security/hmac.ts`:

```
Write the security module for APCRDA TDR. Node.js built-in crypto only.

1. generateApprovalSignature(employeeId, bondId, decision, timestamp): string
   HMAC-SHA256 with process.env.HMAC_SECRET
   Message: `${employeeId}:${bondId}:${decision}:${timestamp}`
   Throws if HMAC_SECRET not set.

2. verifyApprovalSignature(employeeId, bondId, decision, timestamp, hash): boolean
   Uses crypto.timingSafeEqual — prevents timing attacks. Returns false on mismatch.

3. hashAadhaar(aadhaarNumber: string): string
   SHA-256, returns lowercase hex. Used for deduplication and login matching.

4. encryptAadhaar(aadhaarNumber: string): string
   AES-256-GCM, key from AADHAAR_ENCRYPTION_KEY (32-byte hex).
   Random 12-byte nonce per call.
   Returns: base64(nonce).base64(tag).base64(ciphertext)

5. decryptAadhaar(encrypted: string): string
   Reverse. Call ONLY from admin/biometric contexts — never in regular API flows.
```

### Hash-chained audit log

**Cursor prompt** → `src/lib/audit.ts`:

```
Write the three-layer audit log service for APCRDA TDR.

The audit_log table is append-only (DB rules prevent UPDATE/DELETE).
Each row's chain_hash = SHA-256(previousHash + ':' + JSON.stringify(payload))
This creates a tamper-evident chain — modifying any entry breaks all subsequent hashes.

Export:

writeAuditLog(entry: AuditEntry): Promise<void>
AuditEntry: {
  bondId?: string
  actorId?: string
  actorRole?: string
  action: string    // 'BOND_CREATED' | 'L1_APPROVED' | 'CERT_GENERATED' | 'CERBOS_DENY' etc.
  details?: unknown
  ipAddress?: string
  cerbosCallId?: string  // ← from withCerbos() return value — links to Cerbos decision log
  fabricTxId?: string    // ← from fabric.XXX() return value — links to Fabric ledger
}
Steps:
a. Fetch last chain_hash (SELECT chain_hash FROM audit_log ORDER BY id DESC LIMIT 1)
   Genesis value: 'APCRDA-TDR-GENESIS-2026'
b. Redact sensitive fields from details (remove keys: phone, aadhaar, password, token)
c. chain_hash = SHA-256(previousHash + ':' + JSON.stringify({...entry, timestamp}))
d. INSERT using adminClient (service_role bypasses RLS — users cannot insert directly)
e. On failure: logger.error but NEVER throw (audit failure must not break main flow)

verifyAuditChain(fromId?: bigint): Promise<{ intact: boolean; brokenAtId?: bigint }>
Re-computes all hashes from start (or fromId) and checks each stored hash.
Returns { intact: false, brokenAtId: N } if tampered.

The cerbosCallId stored here is the JOIN KEY:
  Query: SELECT * FROM audit_log WHERE cerbos_call_id = 'xyz'
  Also:  GET /admin/auditlog/list/KIND_DECISION?lookup=xyz  (Cerbos Hub API)
  Together they show: what happened in our system + why Cerbos allowed/denied it.
```

### Structured logger

**Cursor prompt** → `src/lib/logger.ts`:

```
Write a structured JSON logger. No third-party libs.
Export logger.info/warn/error/debug(message, meta?).
Each entry: { level, timestamp, service: 'apcrda-tdr', message, ...meta }
Auto-redact keys: phone, aadhaar, password, token, secret, key (recursive).
maskPhone(phone): returns '****{last4}'.
Skip debug in production. Export: logger, maskPhone, redactSensitive.
```

### Error handling

**Cursor prompt** → `src/lib/errors.ts`:

```
Write typed error classes:
ValidationError(400, fields?: Record<string,string>)
AuthenticationError(401, default message "Authentication required")
AuthorizationError(403, optionally stores action + resourceKind for logging)
NotFoundError(404, resource + id)
ConflictError(409, message)
IntegrationError(502, system + statusCode + message) — APCRDA portal failures
FabricError(502, operation + message)

withErrorHandling(handler) HOF: try/catch, map errors to HTTP status,
never expose stack traces in production.
handleApiError(error): returns NextResponse with { success: false, error, code, fields? }
```

**Cursor prompt** → `src/lib/api-response.ts`:

```
Write helpers: ok<T>(data, status?), created<T>(data), noContent(),
paginated<T>(items, total, page, limit), error(message, status, code?, fields?)
All return NextResponse.
```

---

## 9. Hyperledger Fabric network

### What goes on-chain (blockchain is evidence layer, not database)

| Action | Chaincode function | When | What is stored |
|---|---|---|---|
| Bond submitted | `CreateBond` | DEO submits | tdrNumber, surveyNumber, holderAadhaarHash, extentSqYds, ratio, ipfsDocCid |
| Each approval | `RecordApproval` | Every level | level, decision, employeeId, signatureHash, **cerbosCallId**, remarks |
| Certificate | `MintCertificate` | L4 approves | tdrNumber, certificateIpfsCid, commissionerSignatureHash |

Note: `cerbosCallId` is stored in the Fabric chaincode record — this means the blockchain itself records which Cerbos policy decision authorised each approval, making the three audit trails fully cross-referenceable.

### Bootstrap scripts

**Cursor prompt** → `fabric/network/crypto-config.yaml`: single-org APCRDA, domain `apcrda.ap.gov.in`, 2 peers, 3 users (Admin, Commissioner, PlanningOfficer).

**Cursor prompt** → `fabric/network/configtx.yaml`: single-org, Raft orderer, channel `tdr-channel`, profiles APCRDAGenesis + TDRChannel, V2_5 capabilities.

**Cursor prompt** → `fabric/chaincode/tdr-bond-cc/index.js`:

```
Write Hyperledger Fabric 2.5 Node.js chaincode for APCRDA TDR bonds.
Use fabric-contract-api.

1. CreateBond(ctx, bondJson)
   bondJson: { tdrNumber, surveyNumber, holderAadhaarHash, extentSqYds, ratio, ipfsDocCid }
   Prevent duplicate: composite key bond~tdrNumber
   Store with status PENDING_L1. Emit BondCreated event.

2. RecordApproval(ctx, tdrNumber, level, decision, employeeId,
                  signatureHash, cerbosCallId, remarks)
   Validate level 1-4, decision APPROVED|REJECTED|RETURNED.
   For APPROVED (not level 4): advance status (L1→PENDING_L2, L2→L3, L3→L4).
   For APPROVED level 4: set status ACTIVE (certificate will be generated off-chain).
   For RETURNED: set status DRAFT.
   For REJECTED: set status REJECTED.
   IMPORTANT: store cerbosCallId in the approval record.
   Emit ApprovalRecorded event.

3. MintCertificate(ctx, tdrNumber, certificateIpfsCid, commissionerSignatureHash)
   Validate bond status is ACTIVE (L4 already approved).
   Set certificateIpfsCid, mintedAt. Emit CertificateMinted event.

4. GetBond(ctx, tdrNumber): returns bond JSON
5. GetBondHistory(ctx, tdrNumber): GetHistoryForKey — full immutable history
6. QueryBondsByStatus(ctx, status): CouchDB rich query

Verify caller org on write operations: GetClientIdentity().GetMSPID().
```

### Fabric Gateway service

**Cursor prompt** → `src/lib/fabric/gateway.ts`:

```
Write Hyperledger Fabric Gateway service singleton.
Use @hyperledger/fabric-gateway and @grpc/grpc-js.
Load cert/key/TLS from env. Channel: 'tdr-channel', Contract: 'tdr-bond-cc'.

Functions:
1. createBond(params): Promise<string> (returns txId)
2. recordApproval(params: { tdrNumber, level, decision, employeeId,
   signatureHash, cerbosCallId, remarks }): Promise<string>
   Pass cerbosCallId so it's stored on-chain for audit cross-referencing.
3. mintCertificate(tdrNumber, certCid, commissionerHash): Promise<string>
4. getBond(tdrNumber): Promise<FabricBondState>
5. getBondHistory(tdrNumber): Promise<FabricHistoryRecord[]>

Wrap errors in FabricServiceError. Export disconnect() for graceful shutdown.
```

---

## 10. API routes — all 32 endpoints

### Standard route pattern

Every route follows this pattern exactly:

```typescript
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    // 1. Identity (Supabase)
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    // 2. Input validation (Zod)
    const data = mySchema.parse(await req.json());

    // 3. Load resource
    const bond = await prisma.tdrBonds.findUnique({ where: { id: data.bondId } });
    if (!bond) throw new NotFoundError('bond', data.bondId);

    // 4. Authorisation (Cerbos) — store callId for audit
    // AUDIT: Cerbos logs this decision automatically to its own decision log
    const cerbosCallId = await withCerbos(user, {
      kind: 'approval',
      id: bond.id,
      attributes: { status: bond.status, districtCode: bond.districtCode }
    }, 'approve');

    // 5. Business logic
    const result = await withTransaction(async (tx) => { /* ... */ });

    // 6. Blockchain write
    const fabricTxId = await fabric.recordApproval({ ..., cerbosCallId });

    // AUDIT: Log state change with both audit trail join keys
    await writeAuditLog({
      bondId: bond.id, actorId: user.id, actorRole: user.role,
      action: 'L2_APPROVED',
      details: { level: 2, decision: 'APPROVED' },
      cerbosCallId,       // ← links to Cerbos decision log
      fabricTxId,         // ← links to Fabric ledger
      ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return ok({ status: 'PENDING_L3', fabricTxId, cerbosCallId });
  });
}
```

### Complete endpoint list

| Method | Route | Auth | Cerbos resource/action | Fabric | Audit action |
|---|---|---|---|---|---|
| POST | /api/auth/otp/request | public | — | — | — |
| POST | /api/auth/otp/verify | public | — | — | FARMER_LOGIN |
| POST | /api/auth/official/sso | public | — | — | OFFICIAL_LOGIN |
| POST | /api/auth/approval-otp/request | official | — | — | APPROVAL_OTP_REQUESTED |
| POST | /api/auth/approval-otp/verify | official | — | — | APPROVAL_OTP_VERIFIED |
| POST | /api/auth/logout | any | — | — | LOGOUT |
| POST | /api/bonds | DEO/SURVEYOR | bond/create | — | BOND_CREATED |
| GET | /api/bonds | official | bond/view (filtered) | — | — |
| GET | /api/bonds/[id] | any | bond/view | — | — |
| PUT | /api/bonds/[id]/draft | DEO | bond/update | — | BOND_DRAFT_UPDATED |
| POST | /api/bonds/[id]/submit | DEO | bond/submit | createBond | BOND_SUBMITTED |
| GET | /api/bonds/prefill/[surveyNo] | DEO | — | — | — |
| GET | /api/bonds/farmer/mine | FARMER | bond/view | — | — |
| POST | /api/documents/upload | official | bond/upload_document | — | DOCUMENT_UPLOADED |
| GET | /api/documents/[bondId] | any | bond/view | — | — |
| GET | /api/documents/[cid]/download | any | bond/view | — | DOCUMENT_DOWNLOADED |
| GET | /api/approvals/queue | official | — | — | — |
| GET | /api/approvals/[bondId]/history | official | approval/view | — | — |
| POST | /api/approvals/[bondId]/approve | official | approval/approve | recordApproval | Lx_APPROVED |
| POST | /api/approvals/[bondId]/reject | official | approval/reject | recordApproval | Lx_REJECTED |
| POST | /api/approvals/[bondId]/return | official | approval/return | recordApproval | Lx_RETURNED |
| GET | /api/approvals/stats | COMMISSIONER+ | — | — | — |
| POST | /api/certificates/[bondId]/generate | COMMISSIONER+ | certificate/generate | mintCertificate | CERT_GENERATED |
| GET | /api/certificates/[bondId]/download | FARMER | certificate/download | — | CERT_DOWNLOADED |
| GET | /api/certificates/[bondId]/verify | public | — | — | CERT_VERIFIED |
| GET | /api/users/officials | COMMISSIONER+ | — | — | — |
| POST | /api/users/officials | COMMISSIONER+ | — | — | OFFICIAL_CREATED |
| PUT | /api/users/officials/[id]/role | COMMISSIONER+ | — | — | OFFICIAL_ROLE_UPDATED |
| PUT | /api/users/officials/[id]/disable | COMMISSIONER+ | — | — | OFFICIAL_DISABLED |
| GET | /api/users/farmers/[id] | SDC+ | — | — | — |
| PUT | /api/users/farmers/[id] | SDC+ | — | — | FARMER_PHONE_UPDATED |
| GET | /api/health | public | — | — | — |

### Key routes in detail

**`POST /api/bonds/[id]/approve`** (most security-critical):

**Cursor prompt:**

```
Write POST /api/approvals/[bondId]/approve.
Auth: any official role. This is the highest-stakes endpoint in the system.

Steps:
1. getCurrentUser — must be official (not FARMER)
2. Load bond with approval_steps
3. Determine expected level from bond status
4. Cerbos check — withCerbos(user, { kind:'approval', id:bondId,
   attributes:{status, districtCode} }, 'approve')
   Store returned cerbosCallId.
5. Verify official's role matches expected level (defence in depth after Cerbos)
6. Verify approval OTP: load otp_requests for user.id and purpose=APPROVAL,
   check not expired, bcrypt.compare(submittedOtp, otp_hash), mark used=true
7. generateApprovalSignature(user.employeeId, bondId, 'APPROVED', Date.now())
8. withTransaction:
   a. Update approval_steps[level-1]: decision=APPROVED, official_id, signature_hash,
      cerbos_call_id=cerbosCallId, decided_at=now()
   b. Update bond status per state machine
9. fabric.recordApproval({ tdrNumber, level, decision:'APPROVED',
   employeeId, signatureHash, cerbosCallId, remarks: '' })
10. If level 4: trigger certificate generation internally
11. writeAuditLog: action=`L${level}_APPROVED`, cerbosCallId, fabricTxId
Return: ok({ newStatus, signatureHash, cerbosCallId, fabricTxId })
Return 401 on invalid OTP, 403 from Cerbos DENY, 400 if wrong status.
```

**Duplicate submission guard** — add to bond submit:

```typescript
// Before any DB writes in /api/bonds/[id]/submit
const key = req.headers.get('X-Idempotency-Key');
if (key) {
  const cached = await supabase.from('idempotency_cache')
    .select('response').eq('key', key).single();
  if (cached.data) return ok(JSON.parse(cached.data.response));
}
// ... do the work ...
if (key) {
  await supabase.from('idempotency_cache')
    .insert({ key, response: JSON.stringify(result), expires_at: new Date(Date.now() + 86400000) });
}
```

Frontend sends `X-Idempotency-Key: ${crypto.randomUUID()}` on each submit.

---

## 11. APCRDA system integrations

### Mock mode for development

`APCRDA_MOCK_MODE=true` in `.env.local` — returns fixture data so you can build without real API access.

Create `src/lib/integrations/fixtures/`:
- `land-records-award.json` — sample acquisition award
- `gis-parcel.json` — sample GIS parcel (area in **Sq Yards**)
- `farmer-kyc.json` — sample farmer KYC

**Cursor prompt** → `src/lib/integrations/apcrda-adapter.ts`:

```
Write APCRDA integration adapter with mock mode and retry logic.

If APCRDA_MOCK_MODE=true: return fixture data, log warning.

Otherwise:
- OAuth2 client credentials with module-level token cache
- On 401: refresh token once and retry
- On 5xx: exponential backoff retry (3 attempts: 1s/2s/4s)
- Circuit breaker: after 5 consecutive failures, stop calling for 60s
- All calls: Next.js fetch with revalidate: 21600 (6-hour cache)

Functions:
1. verifyAcquisitionAward(surveyNo): AcquisitionAward | null
2. getBondByTdrNumber(tdrNo): LandRecordBond | null
3. getGisParcel(surveyNo): GisParcel | null  ← area MUST be in Sq Yards
4. getVillageMasterList(districtCode?): Village[] — cache 24h
5. getFarmerKyc(farmerId): FarmerKyc | null
6. composePrefillData(surveyNo, tdrNo?): calls all 3 in parallel, returns merged object

Throw IntegrationError on unrecoverable failures.
```

### Village dropdown sync (scheduled)

```typescript
// src/app/api/admin/sync-villages/route.ts
// Called by a cron job every 24h
export async function POST() {
  const villages = await adapter.getVillageMasterList();
  // Upsert into local villages table for fast DEO dropdown
  await prisma.$transaction(villages.map(v =>
    prisma.villages.upsert({
      where: { gisCode: v.villageCode },
      update: { villageName: v.villageName, mandal: v.mandal, district: v.district },
      create: { ...v }
    })
  ));
  await writeAuditLog({ action: 'VILLAGE_MASTER_SYNCED', details: { count: villages.length } });
  return ok({ synced: villages.length });
}
```

---

## 12. DEO portal — 3-phase data entry

### 3-phase form

**v0.dev prompt:**

```
Create a Next.js React multi-step TDR bond entry form.
Progress: Phase 1 (Holder) → Phase 2 (Land) → Phase 3 (Documents).

Phase 1 (10 fields from procedure doc):
TDR Number (text, triggers auto-prefill), Name, Relation Type (S/o D/o W/o),
Relation Name, Aadhaar Number (12-digit masked), Aadhaar-linked Mobile (10-digit),
Email (optional), Door No, Street/Locality, Village (searchable dropdown),
Mandal (auto-fill from village), District (auto-fill).
Show a "Verify & Prefill from APCRDA records" button after TDR Number entry.

Phase 2 (7 fields):
Surrendered Village, Survey Number (with "Verify on GIS" button),
Ownership Deed No/Patta (optional), Surrendered Area Sq Yds (decimal >0),
TDR Issued Extent Sq Yds, Issued Ratio (text, placeholder "1:1",
label: "TDR Ratio — as decided by Authority — do not modify"),
TDR Certificate Number (optional).

Phase 3: 5 upload cards for:
OWNERSHIP_DOCUMENT, AADHAAR_COPY, RETURNABLE_PLOT_ALLOTMENT,
TDR_ISSUED_COPY, INDIVIDUAL_SKETCH.
Each: English label + Telugu label, drag-drop, progress, remove.
Submit disabled until all 5 uploaded.

Use react-hook-form + Zod. Tailwind only.
Wire: Phase1 POST /api/bonds, Phase2 PUT /api/bonds/{id}/draft,
Phase3 each doc POST /api/documents/upload,
Final POST /api/bonds/{id}/submit with confirmation modal.
```

### DEO dashboard

**Cursor prompt** → `src/app/(deo)/dashboard/page.tsx`:

```
Server Component. Fetch bonds created_by current DEO.
4 stat cards: Total / Pending / Approved (ACTIVE) / Rejected.
Bond table: TDR No | Holder | Survey | Area Sq Yds | Status badge | Days pending.
Status badges coloured per state machine (Section 3).
Client island for Supabase Realtime status updates.
"New Bond Entry" → /deo/bonds/new.
```

---

## 13. Official portal — approval chain

### Approval queue

**Cursor prompt** → `src/app/(official)/queue/page.tsx`:

```
Server Component + Realtime client island.
Role-to-status: DY_TAHSILDAR/TAHSILDAR→PENDING_L1, SDC→PENDING_L2,
DIRECTOR_LANDS→PENDING_L3, COMMISSIONER/ADDL→PENDING_L4.
Table: TDR No | Farmer | Village | Survey | Area Sq Yds | Submitted | Days Pending | Action.
Realtime: new bonds flash at top (amber pulse). Badge count updates live.
Commissioner sees all districts (enforced by Cerbos policies + RLS).
```

### Bond review page

**Cursor prompt** → `src/app/(official)/bonds/[id]/review/page.tsx`:

```
Show: bond header, Phase 1 card (Aadhaar as XXXX-XXXX-last4),
Phase 2 card, 5 document cards with signed URL view buttons,
approval history timeline (role, decision, name, timestamp, signatureHash[:8], cerbosCallId[:8]).
Approve button: OTP modal — request OTP → 6-digit input → confirm.
Calls POST /api/auth/approval-otp/request then POST /api/approvals/{id}/approve.
Reject: mandatory remarks + OTP. Return: remarks only (no OTP).
On success: toast + redirect to /official/queue.
```

---

## 14. Farmer PWA

### PWA setup

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public', disable: process.env.NODE_ENV === 'development'
});
module.exports = withPWA({
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value:
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';" }
      ]
    }];
  }
});
```

### Farmer portal components

**v0.dev prompt** for BondCard: TDR number prominent, 5-step progress tracker (animated), status badge, Download Certificate button (ACTIVE only). Mobile-first, 375px. Telugu/English toggle.

**Cursor prompt** for certificate download page: states (initial → OTP sent → downloading → done), OTP flow via `/api/auth/otp/request`, download via signed Supabase URL, QR code via `qrcode` npm package linking to `/verify/{tdrNumber}`.

### Farmer onboarding linkage

When DEO enters a bond:
1. System checks `farmers.aadhaar_phone` — creates record if not found (`supabase_user_id = null`)
2. Bond's `farmer_id` points to the farmers record

When farmer first logs in via OTP:
1. Supabase creates user with that phone
2. OTP verify route finds `farmers` record by `aadhaar_phone`
3. Sets `supabase_user_id = newUser.id` — Auth Hook now injects `farmer_id` into JWT
4. Farmer can see their bonds

**Farmer phone change:** Farmer visits APCRDA office, SDC verifies biometrically, calls `PUT /api/users/farmers/{id}` to update `aadhaar_phone` and revoke Supabase session. No self-service.

---

## 15. Certificate generation and digital signing

### PDF generation

**Cursor prompt** → `src/lib/pdf/certificate.ts`:

```
Write TDR certificate PDF using PDFKit. Official government document layout:
- APCRDA header (seal placeholder, Government of AP, APCRDA name)
- "TRANSFERABLE DEVELOPMENT RIGHTS CERTIFICATE"
- "G.O. 207 MA&UD dt. 08.08.2016 · LPS Rule 5(4)(B)"
- Two columns: holder details (left), land details (right)
  Include: Aadhaar as XXXX-XXXX-{last4}, area in Sq Yards, ratio
- Signature section: "Digitally signed by: [Commissioner Name], Commissioner APCRDA"
- "Transaction Hash: {fabricTxId}"
- QR code placeholder (accept qrBuffer: Buffer)
- Footer: "Verify at: tdr.apcrda.ap.gov.in/verify/{tdrNumber}"
Accept language ('en'|'te'). Return Buffer.
Export: generateCertificatePdf(data: CertificateData, qrBuffer: Buffer, lang?): Promise<Buffer>
```

### Cryptographic PDF signing

```bash
npm install node-signpdf
```

Add `signPdf(pdfBuffer: Buffer): Promise<Buffer>` to `certificate.ts`:
- Load Commissioner's cert and key from env paths
- Embed PKCS#7 detached signature using `node-signpdf`
- Falls back to visible text stamp if PKI cert not yet available from NIC CA
- Add `// TODO: replace with HSM-backed key in production`

### Certificate generate route

**Cursor prompt** → `src/app/api/certificates/[bondId]/generate/route.ts`:

```
POST /api/certificates/[bondId]/generate — called after L4 approval.
Auth: COMMISSIONER or ADDL_COMMISSIONER.
Cerbos: withCerbos(user, { kind:'certificate', id:bondId,
  attributes:{ bondStatus: bond.status } }, 'generate')

Steps:
1. Load bond — verify all 4 approval_steps APPROVED
2. Generate QR buffer: qrcode.toBuffer('https://tdr.apcrda.ap.gov.in/verify/'+tdrNumber)
3. generateCertificatePdf(bondData, qrBuffer) → pdfBuffer
4. signPdf(pdfBuffer) → signedPdfBuffer
5. Upload to Supabase Storage: tdr-certificates/{bondId}/certificate.pdf
6. Pin to IPFS: POST http://IPFS_API_URL/api/v0/add → ipfsCid
7. withTransaction:
   a. Update tdr_bonds: certificate_ipfs_cid, minted_at, status=ACTIVE
8. fabric.mintCertificate(tdrNumber, ipfsCid, signatureHash) → fabricTxId
9. SMS to farmer via MSG91: "Your TDR Certificate {tdrNumber} is ready..."
10. writeAuditLog: action='CERT_GENERATED', cerbosCallId, fabricTxId
Return: ok({ ipfsCid, mintedAt, fabricTxId })
```

---

## 16. Telugu internationalisation

```javascript
// next-i18next.config.js
module.exports = {
  i18n: { defaultLocale: 'en', locales: ['en', 'te'] },
  defaultNS: 'common',
  localePath: './public/locales',
};
```

**Cursor prompt** for `public/locales/te/common.json` — paste the English JSON and ask Claude to translate all keys to Telugu script. Review with native speaker before go-live.

**LanguageToggle component** → `src/components/ui/LanguageToggle.tsx`: two buttons "English | తెలుగు", calls `i18n.changeLanguage()`, stores to `localStorage`.

---

## 17. Supabase Realtime

**Cursor prompt** → `src/components/approval/RealtimeQueue.tsx`:

```
Client component. Props: initialBonds, officialRole, districtCode.
Subscribe to tdr_bonds UPDATE events for this official's level.
New matching bond: add to top with amber flash. Advanced bond: remove.
Show toast "New bond in queue".
Unsubscribe on unmount.
```

**Cursor prompt** → `src/components/farmer/BondStatusTracker.tsx`:

```
Client component. Props: bondId, initialStatus.
5-step bar (L1 Tahsildar → L2 SDC → L3 Director → L4 Commissioner → Certificate).
States: completed=green, current=amber pulsing, pending=grey, rejected=red X.
Subscribe to this bond's status via Supabase Realtime. Animate on change.
Bilingual status messages.
```

---

## 18. Error handling and resilience

### React Error Boundary

**Cursor prompt** → `src/components/ui/ErrorBoundary.tsx`:

```
React class ErrorBoundary. Props: children, fallback?.
On error: show "Something went wrong. Please refresh the page."
with Refresh button and "Report to APCRDA IT" link.
Log to console.error with component stack.
Wrap all three portal layouts in ErrorBoundary.
```

### API retry for APCRDA integrations

Already covered in Section 11 adapter — exponential backoff (1s/2s/4s) + circuit breaker after 5 consecutive failures.

### CORS configuration

Add to `next.config.js` for future external API consumers:

```javascript
async headers() {
  return [{
    source: '/api/v1/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'https://portal.apcrda.ap.gov.in' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-Idempotency-Key' },
    ]
  }];
}
```

---

## 19. Testing strategy

### Unit tests

**Cursor prompt** → `src/__tests__/hmac.test.ts`: valid signatures, tampered signatures, Aadhaar encrypt/decrypt roundtrip, missing HMAC_SECRET throws.

**Cursor prompt** → `src/__tests__/audit.test.ts`: 3 entries form valid chain, verifyAuditChain returns intact, corrupt one entry → brokenAtId returned, writeAuditLog failure never throws.

**Cursor prompt** → `src/__tests__/bond-validation.test.ts`: valid data passes, invalid ratio ("1.5" missing colon) fails, zero area fails, invalid Aadhaar (11 digits) fails, SQL injection in survey number fails.

### Cerbos policy tests

`cerbos/policies/__tests__/bond_tests.yaml`:

```yaml
---
name: APCRDA TDR bond authorization tests
tests:
  - name: DEO can create bonds
    input:
      principal: { id: deo1, roles: [DEO], attributes: { districtCode: KRISHNA } }
      resource:  { kind: bond, id: new, attributes: {} }
      actions:   [create]
    expected: { create: EFFECT_ALLOW }

  - name: FARMER cannot create bonds
    input:
      principal: { id: f1, roles: [FARMER] }
      resource:  { kind: bond, id: new, attributes: {} }
      actions:   [create]
    expected: { create: EFFECT_DENY }

  - name: SDC can approve PENDING_L2 bond in same district
    input:
      principal: { id: sdc1, roles: [SDC], attributes: { districtCode: KRISHNA } }
      resource:  { kind: approval, id: b1, attributes: { status: PENDING_L2, districtCode: KRISHNA } }
      actions:   [approve]
    expected: { approve: EFFECT_ALLOW }

  - name: SDC cannot approve PENDING_L1 bond (wrong level)
    input:
      principal: { id: sdc1, roles: [SDC], attributes: { districtCode: KRISHNA } }
      resource:  { kind: approval, id: b1, attributes: { status: PENDING_L1, districtCode: KRISHNA } }
      actions:   [approve]
    expected: { approve: EFFECT_DENY }

  - name: SDC cannot approve bond in different district
    input:
      principal: { id: sdc1, roles: [SDC], attributes: { districtCode: KRISHNA } }
      resource:  { kind: approval, id: b1, attributes: { status: PENDING_L2, districtCode: GUNTUR } }
      actions:   [approve]
    expected: { approve: EFFECT_DENY }

  - name: Farmer can view own bond
    input:
      principal: { id: f1, roles: [FARMER] }
      resource:  { kind: bond, id: b1, attributes: { farmerId: f1 } }
      actions:   [view]
    expected: { view: EFFECT_ALLOW }

  - name: Farmer cannot view another farmer's bond
    input:
      principal: { id: f1, roles: [FARMER] }
      resource:  { kind: bond, id: b2, attributes: { farmerId: f2 } }
      actions:   [view]
    expected: { view: EFFECT_DENY }

  - name: Commissioner can revoke ACTIVE bond
    input:
      principal: { id: c1, roles: [COMMISSIONER] }
      resource:  { kind: bond, id: b1, attributes: { status: ACTIVE } }
      actions:   [revoke]
    expected: { revoke: EFFECT_ALLOW }

  - name: SDC cannot revoke bond (wrong role for revoke)
    input:
      principal: { id: sdc1, roles: [SDC], attributes: { districtCode: KRISHNA } }
      resource:  { kind: bond, id: b1, attributes: { status: ACTIVE, districtCode: KRISHNA } }
      actions:   [revoke]
    expected: { revoke: EFFECT_DENY }
```

Run: `docker run --rm -v $(pwd)/cerbos:/cerbos ghcr.io/cerbos/cerbos:0.38.0 compile --tests /cerbos/policies`

### Chaincode tests

**Cursor prompt** → `fabric/chaincode/tdr-bond-cc/test/bond.test.js`:

```
Fabric chaincode tests using mock stubs.
Test: CreateBond succeeds, duplicate fails, L1 approve → PENDING_L2,
wrong level fails, L4 approve → ACTIVE, MintCertificate on non-ACTIVE fails,
GetBondHistory returns entries in order,
cerbosCallId stored in approval record (verify in chaincode state).
```

### GitHub Actions CI

**Cursor prompt** → `.github/workflows/ci.yml`:

```
Jobs: lint-typecheck, unit-tests, cerbos-policy-tests (docker run compile --tests),
chaincode-tests, integration-tests (supabase start + seed), docker-build (Trivy scan),
deploy-staging (main only via SSH). Cache node_modules. Fail on CRITICAL CVEs.
```

---

## 20. Deployment

### Docker Compose

**Cursor prompt** → `docker-compose.yml`:

```
Services: app (Next.js:3000), cerbos (PDP, gRPC:3593, with TLS in prod),
fabric-peer, fabric-orderer, fabric-couchdb, ipfs (kubo, internal only), nginx (80/443).
Only nginx exposed to internet. Internal bridge network.
Volumes: fabric_data, couchdb_data, ipfs_data, cerbos_logs.
```

### Nginx config

```nginx
server {
    listen 443 ssl http2;
    server_name tdr.apcrda.ap.gov.in;
    ssl_protocols TLSv1.3;
    ssl_certificate /etc/nginx/ssl/tdr.crt;
    ssl_certificate_key /etc/nginx/ssl/tdr.key;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    limit_req_zone $binary_remote_addr zone=otp:10m rate=5r/m;
    location /api/auth/otp/ { limit_req zone=otp burst=3; proxy_pass http://app:3000; }
    location / { proxy_pass http://app:3000; proxy_set_header X-Real-IP $remote_addr; }
}
server { listen 80; return 301 https://$host$request_uri; }
```

### Dockerfile

**Cursor prompt**: multi-stage, node:20-alpine, non-root user, `.next/standalone`, output < 500MB, proper `.dockerignore`.

### Rollback procedure

```bash
# Bad deployment reached production:

# 1. Roll back Docker image
docker compose down
docker tag apcrda-tdr:previous apcrda-tdr:latest
docker compose up -d

# 2. Roll back Prisma migration if needed
npx prisma migrate resolve --rolled-back <migration-name>

# 3. Roll back Cerbos policies (in git)
git revert HEAD    # reverts YAML files
docker compose restart cerbos    # Cerbos hot-reloads automatically

# 4. Fabric chaincode: cannot roll back (immutable ledger)
# Deploy new version (increment CC_SEQUENCE in deploy-chaincode.sh)

# 5. Query audit_log to find affected bonds:
# SELECT * FROM audit_log WHERE created_at BETWEEN rollback_start AND rollback_end;
```

### Secrets rotation

```bash
# HMAC_SECRET (every 6 months):
# 1. Generate: openssl rand -hex 32
# 2. Add HMAC_SECRET_NEW=<new> alongside HMAC_SECRET=<old>
# 3. verifyApprovalSignature tries new key first, falls back to old
# 4. After 24h: remove old key

# AADHAAR_ENCRYPTION_KEY (requires re-encryption):
# 1. Generate new: openssl rand -hex 32
# 2. Deploy with both AADHAAR_ENCRYPTION_KEY and AADHAAR_ENCRYPTION_KEY_OLD
# 3. Run: npx tsx scripts/re-encrypt-aadhaar.ts (background job, logs progress)
# 4. Remove old key after completion

# Cerbos gRPC credentials: rotate in config.yaml + restart cerbos container
```

### Backup and disaster recovery

```bash
# Supabase: enable PITR in Dashboard → Project Settings → Database (Pro plan required)
# Retention: 30 days minimum for production

# Fabric ledger snapshots (cron daily at 2am):
0 2 * * * docker exec fabric-peer peer snapshot submitrequest -C tdr-channel \
  && tar czf /backups/fabric-$(date +%Y-%m-%d).tar.gz /var/hyperledger/production/
  && scp /backups/fabric-$(date +%Y-%m-%d).tar.gz backup@nic-storage:/apcrda-tdr/

# Cerbos audit logs: already retained for 7 days in local storage
# Forward to NIC S3-compatible storage for long-term retention

# RTO: 4 hours | RPO: 24 hours
```

---

## 21. Git workflow and branching

```
main      ← production (protected, no direct push, require 1 reviewer + all CI green)
develop   ← integration (merges to main weekly)
  ├── feature/bond-form-phase1
  ├── feature/cerbos-policies
  ├── feature/approval-otp
  └── feature/farmer-pwa
hotfix/*  ← branch from main, merge to main + develop
```

**Commit format:** `type(scope): description`
- `feat(bonds): add Phase 2 land details form`
- `fix(cerbos): correct l2_approver district condition`
- `security(hmac): fix timing attack in verifyApprovalSignature`

**PR template** `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What does this PR do?

## APCRDA domain check
- [ ] TDR unit is Sq Yards (not sq meters) in all new code
- [ ] TDR ratio is stored as string, never computed
- [ ] No hardcoded if(role==='X') — Cerbos policies used
- [ ] Aadhaar stored only as hash or encrypted
- [ ] writeAuditLog() called for all state changes
- [ ] cerbosCallId stored in approval_steps and audit_log where applicable
- [ ] fabricTxId stored in DB records with on-chain counterparts

## Testing
- [ ] Unit tests pass
- [ ] Cerbos policy tests pass (compile --tests)
- [ ] Manual test: [describe]

## Deployment notes (migrations? env vars? Cerbos policy changes?)
```

---

## 22. Monitoring and alerting

### Health check

**Cursor prompt** → `src/app/api/health/route.ts`:

```
GET /api/health — public, no auth.
Check in parallel with 3s timeout:
1. Database: prisma.$queryRaw`SELECT 1` — latency
2. Cerbos: getCerbosClient().checkResource dummy call — just need a response
3. Fabric: fabric.getBond('HEALTH_CHECK') — expect FabricError (peer alive)
4. IPFS: fetch IPFS_API_URL/api/v0/id
Response: { status: healthy|degraded|unhealthy, timestamp, version, checks }
200 for healthy/degraded, 503 for unhealthy (DB or Cerbos down).
```

### Prometheus + Grafana

Add to `docker-compose.yml` — `prometheus:9090`, `grafana:3010`.

Key alerts:
- Health check fails 3× in 5 min → PagerDuty
- OTP requests > 50/min → brute force alert
- Cerbos DENY rate > 10% of requests → policy misconfiguration or attack
- Fabric peer disconnected > 2 min → blockchain writes failing
- Audit chain integrity check fails → tamper alert

### Audit chain integrity cron

```bash
# Run weekly (cron on NIC server)
0 3 * * 0 curl -s -X POST https://tdr.apcrda.ap.gov.in/api/admin/verify-audit-chain \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.intact' | grep -q 'true' || echo "AUDIT CHAIN INTEGRITY FAILURE" | mail -s "ALERT" it@apcrda.ap.gov.in
```

---

## 23. Operational procedures

### Bulk import of existing paper bonds

**Cursor prompt** → `scripts/bulk-import.ts`:

```
TypeScript script for bulk CSV import. Columns: TDR_NO, HOLDER_NAME, AADHAAR_NO,
PHONE, VILLAGE, SURVEY_NO, OWNERSHIP_DEED, AREA_SQ_YDS, RATIO, EXTENT_SQ_YDS, CERT_NO

Per row: validate fields, check duplicate tdrNumber,
hashAadhaar + encryptAadhaar, create bond + holder + land_details + 5 approval_steps
in withTransaction, writeAuditLog action=BULK_IMPORT.
Log progress every 50 rows. Print final summary (imported/skipped/failed).
Run: npx tsx scripts/bulk-import.ts ./data/bonds.csv
```

### API versioning

Current routes are under `/api/`. Add `/api/v1/` prefix when external consumers need stability:

```typescript
// src/app/api/v1/bonds/route.ts
export { GET, POST } from '@/app/api/bonds/route';
```

---

## 24. Week-by-week activity plan

| Week | Days | Focus | Key deliverables |
|---|---|---|---|
| 1 | 1–5 | Foundation | Supabase setup (Phone Auth + NIC SSO + Auth Hook), Cerbos PDP + 5 YAML policies + policy tests, Prisma schema + RLS + Storage buckets, security modules (hmac, audit, logger, errors), middleware + getCurrentUser, end-to-end OTP test |
| 2 | 6–10 | Data entry | Bond Zod validation, POST /api/bonds, document upload route (MIME + Storage + IPFS), bond submit route (idempotency key + Fabric createBond), APCRDA adapter (mock mode), DEO portal UI (v0.dev → Cursor refine) |
| 3 | 11–15 | Approval chain | Approval OTP routes, POST /api/approvals/approve (Cerbos + OTP + HMAC + Fabric + three-layer audit), reject + return routes, official portal queue + review pages, end-to-end 4-level approval test |
| 4 | 16–20 | Farmer PWA | Farmer login, BondStatusTracker with Realtime, certificate PDF (PDFKit + signPdf), certificate generate route, download (OTP-gated), QR verify, Telugu i18n, PWA manifest, Android install test |
| 5 | 21–25 | Quality + launch | Unit tests + Cerbos policy tests + chaincode tests, security audit (RLS, HMAC timing, Aadhaar, CORS/CSP), Docker + Nginx + GitHub Actions CI, UAT with real APCRDA officials, fix issues, production deployment |

---

## 25. AI prompt library

Version-controlled in `prompts/` directory.

### New API route

```
Write a Next.js 14 App Router {METHOD} /api/{path} handler.
Auth: {role list} only. Verify via getCurrentUser(cookies()).
Cerbos: const cerbosCallId = await withCerbos(user,
  { kind:'{resource}', id:{id}, attributes:{...} }, '{action}').
Body/query: {describe params}.
Steps:
1. getCurrentUser — throw AuthenticationError if null
2. Validate input with Zod (schema: @/lib/validations/)
3. withCerbos check — store cerbosCallId
4. Load resource from Prisma — throw NotFoundError if missing
5. Business logic in withTransaction()
6. Fabric write (if state changes) — store fabricTxId
7. // AUDIT: [explain what this log entry records]
   writeAuditLog({ bondId, actorId, actorRole, action:'ACTION_NAME',
   details:{...}, cerbosCallId, fabricTxId, ipAddress })
8. Return ok({ ... })
Wrap in withErrorHandling().
```

### New Cerbos policy rule

```
Write a Cerbos resource policy YAML rule for '{resource-kind}'.
Resource attributes: {list}.
Principal attributes: role, districtCode, employeeId, farmerId.
Rules needed: {action} allowed for {condition} for roles {roles}.
Use derived roles from apcrda_derived.yaml where applicable.
Add a comment on each rule explaining it in plain English.
```

### Security code review

```
Review this APCRDA TDR code for:
1. Missing Cerbos check (should withCerbos() be called?)
2. Missing audit log (is writeAuditLog called? Is cerbosCallId stored?)
3. Aadhaar exposure (is it only stored as hash or encrypted?)
4. Domain violation (Sq Yards not sq meters? ratio not computed?)
5. TypeScript strict violations (any, missing returns)
6. Missing error handling (all paths covered by withErrorHandling?)
{paste code}
List each issue with line number and fix.
```

---

## Appendix A — Debugging patterns

### Cerbos DENY unexpected

```
My Cerbos check returns DENY but I expect ALLOW.
Principal I'm sending: {paste}
Resource I'm sending: {paste}
Action: {action}
Policy file: {paste relevant YAML rule}
What is wrong? Show the fix.
```

### RLS blocking query

```
My Prisma query returns empty results but data exists.
Query: {paste}
Table RLS policies: {paste from Supabase Dashboard}
JWT app_metadata of caller: {paste decoded JWT claims}
Which policy is blocking this? Show the fix.
```

### Audit chain broken

```
verifyAuditChain() reports broken at id {N}.
Entry {N}: {paste row}
Entry {N-1}: {paste row}
Show me how to compute the expected chain_hash and compare to stored value.
Is this corruption or a code bug in writeAuditLog()?
```

### Cerbos + audit_log cross-reference

```
I need to investigate what happened to bond {tdrNumber} on {date}.
I have:
  audit_log rows: {paste relevant rows including cerbos_call_id}
  Cerbos decision log for cerbos_call_id={id}: {paste Cerbos log entry}
  Fabric history: {paste GetBondHistory output}
Do all three agree? What does this tell me about what happened?
```

### Fabric transaction fails

```
Fabric transaction failing: {error from @hyperledger/fabric-gateway}
Function: {name}, Arguments: {paste}
Is this chaincode logic, endorsement policy, or connection error? Show fix.
```

### Session not refreshing

```
My Next.js middleware calls supabase.auth.getUser() but the session
is still expired. The cookie in the request is: {paste cookie name/value}
What could prevent the session refresh? Show the correct middleware code.
```

---

## Appendix B — Complete file structure

```
apcrda-tdr/
│
├── .cursorrules                         ← AI project context (commit)
├── .env.example                         ← env template (commit)
├── .env.local                           ← real secrets (NEVER commit)
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml
├── tsconfig.json
├── next.config.js                       ← PWA + headers + CORS
├── next-i18next.config.js
├── docker-compose.yml
├── Dockerfile
│
├── cerbos/
│   ├── config.yaml                      ← audit log enabled, gRPC settings
│   └── policies/
│       ├── derived_roles.yaml           ← l1_approver, l2_approver, bond_owner_farmer
│       ├── resource_bond.yaml
│       ├── resource_approval.yaml
│       ├── resource_certificate.yaml
│       ├── resource_document.yaml
│       └── __tests__/bond_tests.yaml   ← Cerbos built-in policy tests
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── fabric/
│   ├── network/
│   │   ├── crypto-config.yaml
│   │   ├── configtx.yaml
│   │   └── docker-compose.yml
│   ├── chaincode/tdr-bond-cc/
│   │   ├── index.js                    ← stores cerbosCallId on-chain
│   │   ├── package.json
│   │   └── test/bond.test.js
│   └── scripts/
│       ├── bootstrap.sh
│       └── deploy-chaincode.sh
│
├── public/
│   ├── locales/en/common.json
│   ├── locales/te/common.json
│   └── manifest.json
│
├── scripts/
│   ├── bulk-import.ts                  ← CSV import of existing bonds
│   ├── pre-launch-check.sh
│   └── setup-production.sh
│
├── monitoring/prometheus.yml
├── prompts/                            ← AI prompt templates
│   ├── new-api-route.md
│   ├── new-cerbos-policy.md
│   └── security-review.md
│
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── farmer-login/page.tsx
    │   │   └── official-login/page.tsx
    │   ├── (farmer)/
    │   │   ├── dashboard/page.tsx
    │   │   ├── bonds/[id]/page.tsx
    │   │   └── certificates/[id]/page.tsx
    │   ├── (deo)/
    │   │   ├── dashboard/page.tsx
    │   │   └── bonds/new/page.tsx
    │   ├── (official)/
    │   │   ├── queue/page.tsx
    │   │   └── bonds/[id]/review/page.tsx
    │   ├── verify/[tdrNumber]/page.tsx ← public, no Cerbos check
    │   └── api/
    │       ├── auth/ (6 routes)
    │       ├── bonds/ (8 routes)
    │       ├── documents/ (3 routes)
    │       ├── approvals/ (6 routes)
    │       ├── certificates/ (3 routes)
    │       ├── users/ (5 routes)
    │       └── health/route.ts
    │
    ├── components/
    │   ├── ui/LanguageToggle.tsx
    │   ├── ui/ErrorBoundary.tsx
    │   ├── bond-form/BondEntryForm.tsx
    │   ├── bond-form/Phase1HolderForm.tsx
    │   ├── bond-form/Phase2LandForm.tsx
    │   ├── bond-form/DocumentUploadPhase.tsx
    │   ├── approval/ApprovalQueue.tsx
    │   ├── approval/BondReviewPanel.tsx
    │   ├── approval/ApprovalModal.tsx
    │   ├── approval/RealtimeQueue.tsx
    │   └── farmer/BondStatusTracker.tsx
    │
    ├── lib/
    │   ├── supabase/client.ts
    │   ├── cerbos/client.ts             ← Cerbos gRPC singleton
    │   ├── cerbos/enforce.ts            ← withCerbos() → returns cerbosCallId
    │   ├── fabric/gateway.ts            ← stores cerbosCallId on Fabric
    │   ├── pdf/certificate.ts
    │   ├── integrations/apcrda-adapter.ts
    │   ├── integrations/fixtures/
    │   ├── security/hmac.ts
    │   ├── audit.ts                     ← cerbosCallId + fabricTxId stored
    │   ├── errors.ts
    │   ├── api-response.ts
    │   ├── logger.ts
    │   ├── prisma.ts
    │   └── validations/bond.ts / approval.ts
    │
    ├── types/index.ts
    └── middleware.ts
```

---

## Appendix C — Pre-launch checklist

### APCRDA API access (confirm before Week 2, Day 6)

- [ ] Land Records API staging endpoint accessible from NIC server
- [ ] GIS WFS endpoint accessible — returns area in **Sq Yards** (confirm unit)
- [ ] Farmer Portal API accessible
- [ ] OAuth2 client credentials (client_id + secret) issued for TDR platform
- [ ] `APCRDA_MOCK_MODE=false` set in staging environment
- [ ] Field name mapping confirmed: area unit, Aadhaar hash format, ratio format

### Supabase (confirm before Week 1, Day 2)

- [ ] Phone Auth enabled — OTP delivered to real AP mobile number via MSG91
- [ ] NIC SSO configured — callback URL set to staging domain
- [ ] Auth Hook deployed and tested — JWT contains role, district_code, farmer_id/employee_id
- [ ] `tdr-documents` and `tdr-certificates` buckets created with correct RLS policies
- [ ] PITR enabled in Supabase (Pro plan)

### Cerbos (confirm before Week 1, Day 3)

- [ ] PDP container running — gRPC responding on 3593
- [ ] `docker run cerbos compile --tests` passes all policy tests
- [ ] Audit logging enabled in config.yaml — decision logs writing to /var/log/cerbos
- [ ] Production: TLS enabled on gRPC port, admin credentials rotated
- [ ] Can query decision logs via Cerbos Admin API

### Security (confirm before UAT, Week 5)

- [ ] `npx tsc --noEmit` clean — no TypeScript errors
- [ ] `npm run lint` clean — no any types
- [ ] grep -r "aadhaar_number" src/ returns no plaintext exposure
- [ ] HMAC_SECRET is 32+ bytes random (not placeholder)
- [ ] AADHAAR_ENCRYPTION_KEY is 32 bytes random
- [ ] Every approval route calls `withCerbos()` before business logic
- [ ] Every state change calls `writeAuditLog()` with `cerbosCallId`
- [ ] `cerbos_call_id` stored in `approval_steps` table
- [ ] `cerbos_call_id` stored in `audit_log` table
- [ ] `fabric_tx_id` stored in `tdr_bonds` and `approval_steps`
- [ ] RLS: farmer A cannot see farmer B bonds (manual test, 2 accounts)
- [ ] RLS: Krishna official cannot see Guntur bonds (manual test)
- [ ] `verifyAuditChain()` returns `intact: true` on staging data
- [ ] Cerbos decision logs accessible via Admin API for staging bonds
- [ ] Fabric `GetBondHistory` matches audit_log for a test bond

### Portals (confirm before UAT)

- [ ] DEO 3-phase form works on Android Chrome (mobile)
- [ ] DEO double-click submit handled (idempotency key works)
- [ ] End-to-end 4-level approval chain tested with real official accounts
- [ ] Farmer OTP login works with a real Andhra Pradesh mobile number
- [ ] Certificate PDF renders with QR code and is readable
- [ ] Telugu language renders correctly — reviewed by native speaker
- [ ] Realtime: bond appears in official queue immediately on DEO submit
- [ ] Public verify page works from QR code scan without login
- [ ] ErrorBoundary shows friendly message on component crash
- [ ] Idle timeout redirects to login after 30 minutes (test manually)

---

## Appendix D — UAT test script

Hand this to the APCRDA officials and DEO team on UAT day. Print one copy per tester.

---

### Scenario 1 — DEO enters a new offline TDR bond

**Tester role:** DEO officer  
**Portal:** http://staging.tdr.apcrda.ap.gov.in/deo/bonds/new  
**Pre-condition:** Logged in via NIC SSO

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Enter TDR number `12021(47)/133/2018` | System checks Land Records API — pre-fills fields automatically | |
| 2 | Verify pre-filled holder name, village, district | Data matches APCRDA land records | |
| 3 | Enter Aadhaar number `999999999999` | Field masked as XXXX-XXXX-9999 immediately | |
| 4 | Enter mobile number `9999999999` | Accepted as 10-digit Aadhaar-linked number | |
| 5 | Click Next → Phase 2 | Form advances, Phase 1 saved as DRAFT | |
| 6 | Enter Survey No `21/2B` | GIS verify button highlights the parcel | |
| 7 | Enter Surrendered Area `770` (Sq Yds) | Field shows "Sq Yds" label — confirm NOT sq meters | |
| 8 | Enter TDR Ratio `1:1` | Accepted as-is (no computation shown) | |
| 9 | Enter TDR Extent `770` (Sq Yds) | Accepted | |
| 10 | Click Next → Phase 3 | Document upload phase shown | |
| 11 | Upload Ownership Document (PDF) | Upload progress bar, ✓ green check on completion | |
| 12 | Upload Aadhaar Copy (JPG or PDF) | Upload succeeds, file name shown | |
| 13 | Upload Returnable Plot Allotment (PDF) | Upload succeeds | |
| 14 | Upload TDR Issued Copy (PDF) | Upload succeeds | |
| 15 | Upload Individual Sketch (PDF or PNG) | Upload succeeds, Submit button activates | |
| 16 | Click Review & Submit → confirm | Summary modal shows all 3 phases | |
| 17 | Click Confirm Submit | Success message: "Bond submitted to Dy. Tahsildar queue" | |
| 18 | Return to DEO dashboard | Bond appears with status badge **PENDING L1** in amber | |
| 19 | Click Submit again (double-click simulation) | Same success response — no duplicate bond created | |

---

### Scenario 2 — Dy. Tahsildar (L1) reviews and approves

**Tester role:** Dy. Tahsildar  
**Portal:** http://staging.tdr.apcrda.ap.gov.in/official/queue

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open queue page | Bond from Scenario 1 appears without page refresh (Realtime) | |
| 2 | Click "Review & Decide" | Bond review page opens | |
| 3 | View Phase 1 holder details | Aadhaar shown as XXXX-XXXX-9999 (not full number) | |
| 4 | View Phase 2 land details | Area shows 770 Sq Yds | |
| 5 | Click "View" on each document | Document opens in new tab (signed URL) | |
| 6 | Check approval history timeline | Shows "L1 — Pending" | |
| 7 | Click Approve | Modal: "You are approving as DY_TAHSILDAR — EMP001" | |
| 8 | Click "Send OTP to verify" | SMS received on registered phone within 30 seconds | |
| 9 | Enter wrong OTP `000000` | Error: "Invalid OTP. Please try again." Modal stays open | |
| 10 | Enter correct OTP | "Confirm Approval" button activates | |
| 11 | Click Confirm Approval | Success toast: "Bond approved. Moved to L2 queue." | |
| 12 | Bond disappears from L1 queue | Queue updates without page refresh | |
| 13 | Login as SDC officer | Bond appears in SDC queue (PENDING L2) | |

---

### Scenario 3 — SDC (L2) validates and approves

**Tester role:** SDC officer

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open queue | Bond shows PENDING_L2 | |
| 2 | Review documents | All 5 document types visible | |
| 3 | View approval history | L1 shows APPROVED with approver name, timestamp, signature hash | |
| 4 | Approve with OTP | Bond moves to PENDING_L3 | |

---

### Scenario 4 — Director (Lands) (L3) countersigns

**Tester role:** Director Lands

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open queue | Bond shows PENDING_L3 | |
| 2 | View approval history | L1 and L2 both show APPROVED with signatures | |
| 3 | Approve with OTP | Bond moves to PENDING_L4 | |

---

### Scenario 5 — Commissioner (L4) approves and certificate issued

**Tester role:** Commissioner / Addl. Commissioner

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open queue | Bond shows PENDING_L4 | |
| 2 | Review full history | All 3 prior levels show APPROVED | |
| 3 | Approve with OTP | Certificate generation triggered automatically | |
| 4 | Success message | "Certificate generated. Farmer notified via SMS." | |
| 5 | Bond status | Changed to **ACTIVE** (green badge) | |

---

### Scenario 6 — Farmer logs in and downloads certificate

**Tester role:** Farmer (use test phone number that was entered by DEO)

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open http://staging.tdr.apcrda.ap.gov.in/farmer-login | Login page in English | |
| 2 | Click "తెలుగులో చూడండి" | All text switches to Telugu | |
| 3 | Enter 10-digit mobile number | "Send OTP" button activates | |
| 4 | Click Send OTP | "OTP sent to ****9999" message shown | |
| 5 | Enter 6-digit OTP | Login succeeds | |
| 6 | My TDR bonds dashboard | Bond card shows with ACTIVE status (green) | |
| 7 | View approval progress bar | All 4 steps filled green | |
| 8 | Click "Download Certificate" | "Request Download OTP" shown | |
| 9 | Request download OTP | New OTP sent (separate from login OTP) | |
| 10 | Enter download OTP | Certificate PDF opens / downloads | |
| 11 | Verify PDF content | TDR number, holder name, 770 Sq Yds, ratio 1:1 visible | |
| 12 | Commissioner signature section | "Digitally signed by: Commissioner, APCRDA" visible | |
| 13 | QR code visible on certificate | Present in bottom-right corner | |

---

### Scenario 7 — QR code public verification

**Tester:** Anyone (no login required)

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Scan QR code on certificate | Opens http://tdr.apcrda.ap.gov.in/verify/12021-47-133-2018 | |
| 2 | Verification page loads | Shows: TDR number, holder name (first + last initial), village, Sq Yds, status ACTIVE | |
| 3 | Blockchain proof section | Shows Fabric transaction hash | |
| 4 | Try a fake TDR number | "Certificate not found or invalid" message | |

---

### Scenario 8 — Rejection flow

**Tester role:** SDC officer (L2)

| Step | Action | Expected result | Pass / Fail |
|---|---|---|---|
| 1 | Open a PENDING_L2 bond | Review page opens | |
| 2 | Click Reject | Modal opens with mandatory remarks field | |
| 3 | Enter less than 20 characters | "Remarks must be at least 20 characters" validation error | |
| 4 | Enter full rejection reason | OTP step activates | |
| 5 | Complete OTP | Bond status → REJECTED (red badge) | |
| 6 | Check farmer portal | Bond shows REJECTED status with reason | |

---

### Scenario 9 — Security tests (run by APCRDA IT team)

| Test | Expected result | Pass / Fail |
|---|---|---|
| Farmer A tries to view Farmer B's bond URL directly | 403 from Cerbos — "Not allowed to view on bond" | |
| SDC officer tries to approve an L1 bond (wrong level) | 403 — Cerbos DENY logged | |
| Guntur official tries to access Krishna district bonds | Empty result (RLS district isolation) | |
| DEO tries to approve their own submitted bond at L1 | 403 — role DEO not allowed to approve | |
| OTP entered 5 times incorrectly | Lockout message shown, OTP endpoint returns 429 | |
| Try to download certificate without OTP | 401 — authentication required | |
| Access /api/users/ as a farmer | 403 — role not allowed | |
| Query audit_log directly via Supabase API as farmer | Empty result (RLS blocks) | |

---

## Appendix E — Admin tools and data export

### Admin-only API routes

These routes require `COMMISSIONER` or `ADDL_COMMISSIONER` role.

**`GET /api/admin/audit-chain-verify`** — run weekly via cron or on demand:

```typescript
// src/app/api/admin/audit-chain-verify/route.ts
export async function GET() {
  return withErrorHandling(async () => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();
    if (!['COMMISSIONER', 'ADDL_COMMISSIONER'].includes(user.role))
      throw new AuthorizationError();

    const result = await verifyAuditChain();
    // Always log this check itself
    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'AUDIT_CHAIN_VERIFIED',
      details: result,
    });
    return ok(result);
  });
}
```

**`GET /api/admin/bonds/export`** — export bond list as CSV for APCRDA reports:

**Cursor prompt** → `src/app/api/admin/bonds/export/route.ts`:

```
Write GET /api/admin/bonds/export.
Auth: COMMISSIONER or ADDL_COMMISSIONER only.
Cerbos: withCerbos(user, { kind:'bond', id:'export', attributes:{} }, 'view')
Query params: status?, districtCode?, fromDate?, toDate?
Steps:
1. Fetch bonds with all relations (bond_holders, bond_land_details, approval_steps)
2. Build CSV string with headers:
   TDR_NUMBER, HOLDER_NAME, AADHAAR_PHONE_LAST4, VILLAGE, MANDAL, DISTRICT,
   SURVEY_NUMBER, SURRENDERED_AREA_SQ_YDS, TDR_EXTENT_SQ_YDS, ISSUED_RATIO,
   STATUS, SUBMITTED_DATE, APPROVED_DATE, CERTIFICATE_IPFS_CID
   Note: NEVER include full Aadhaar in export — only last 4 digits of phone
3. Return as text/csv with Content-Disposition: attachment; filename="tdr-bonds-{date}.csv"
4. writeAuditLog: action='BONDS_EXPORTED', details: { count, filters, districtCode }
```

**`GET /api/admin/cerbos-decisions`** — query Cerbos decision log for a bond:

```typescript
// src/app/api/admin/cerbos-decisions/route.ts
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await getCurrentUser(cookies());
    if (!['COMMISSIONER', 'ADDL_COMMISSIONER'].includes(user?.role ?? ''))
      throw new AuthorizationError();

    const { searchParams } = new URL(req.url);
    const cerbosCallId = searchParams.get('cerbosCallId');

    // Query Cerbos Admin API for the specific decision
    const response = await fetch(
      `http://${process.env.CERBOS_PDP_URL?.replace(':3593', ':3592')}/admin/auditlog/list/KIND_DECISION?lookup=${cerbosCallId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.CERBOS_ADMIN_USER}:${process.env.CERBOS_ADMIN_PASSWORD}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) throw new IntegrationError('cerbos', response.status, 'Failed to fetch decision log');
    const data = await response.json();
    return ok(data);
  });
}
```

### Print-ready certificate

Add CSS print styles so the certificate can be printed at APCRDA offices on A4 paper:

```css
/* src/app/(farmer)/certificates/[id]/print.css */
@media print {
  /* Hide all navigation, buttons, and chrome */
  nav, header, footer, button, .download-btn, .language-toggle { display: none !important; }

  /* Certificate content fills the page */
  .certificate-content {
    width: 100%;
    max-width: none;
    padding: 0;
    margin: 0;
  }

  /* Force A4 page size */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  /* Ensure QR code prints clearly */
  .qr-code img {
    width: 80px;
    height: 80px;
    print-color-adjust: exact;
  }

  /* Blockchain hash in monospace for readability */
  .blockchain-hash {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    word-break: break-all;
  }
}
```

Add a "Print Certificate" button to the farmer certificate page:

```tsx
<button
  onClick={() => window.print()}
  className="print:hidden border border-gray-300 px-4 py-2 rounded text-sm"
>
  🖨 Print Certificate
</button>
```

---

## Appendix F — Quick-start cheat sheet

Paste this on the team's Notion/Confluence page for day-one reference.

### First-time setup (run once)

```bash
# 1. Clone and install
git clone https://github.com/apcrda/tdr-platform.git
cd tdr-platform
npm install

# 2. Environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#           SUPABASE_SERVICE_ROLE_KEY, HMAC_SECRET, AADHAAR_ENCRYPTION_KEY
# Leave APCRDA_MOCK_MODE=true for now
# Leave all Fabric vars pointing to localhost

# 3. Database
npx prisma generate
npx prisma db push          # creates all tables in Supabase
npx prisma db seed          # creates 5 test officials + 2 farmers + 3 bonds

# 4. Cerbos PDP
docker run --rm --name cerbos \
  -v $(pwd)/cerbos/policies:/policies \
  -v $(pwd)/cerbos/config.yaml:/config.yaml \
  -p 3592:3592 -p 3593:3593 \
  ghcr.io/cerbos/cerbos:0.38.0 server --config=/config.yaml

# 5. Hyperledger Fabric
bash fabric/scripts/bootstrap.sh     # crypto + genesis + channel join
bash fabric/scripts/deploy-chaincode.sh

# 6. Start Next.js
npm run dev    # http://localhost:3000
```

### Daily development commands

```bash
npm run dev                   # start Next.js dev server
npm test                      # run Jest unit tests
npm run test:watch            # watch mode during TDD
npm run db:studio             # Prisma Studio at localhost:5555
npm run fabric:logs           # tail Fabric peer logs

# Cerbos policy tests (run after editing any YAML)
docker run --rm \
  -v $(pwd)/cerbos/policies:/policies \
  ghcr.io/cerbos/cerbos:0.38.0 compile --tests /policies

# Type check without building
npx tsc --noEmit

# Lint
npm run lint
```

### Test each role

```bash
# Open browser → http://localhost:3000

# Farmer login
# → /farmer-login → enter phone: 9999999999 → OTP arrives in Supabase logs
#   (local dev: check Supabase Dashboard → Auth → Users → click user → Auth logs)

# DEO login
# → /official-login → click "Login with NIC SSO"
# → (in dev, Supabase redirects to mock SSO; use test DEO credentials)
# → reaches /deo/dashboard

# Approval chain test (use npx prisma db seed first)
# → Login as DY_TAHSILDAR → /official/queue → PENDING_L1 bond visible
# → Approve → OTP (check Supabase logs in dev) → moves to L2

# Check Cerbos decisions (in dev)
curl http://localhost:3592/admin/auditlog/list/KIND_DECISION?tail=10 \
  -u cerbos-admin:change-me-in-prod | jq '.result[].decisionLogEntry | {principal:.inputs[0].principal.id, action:.outputs[0].actions}'
```

### package.json scripts reference

```json
{
  "scripts": {
    "dev":             "next dev",
    "build":           "next build",
    "start":           "next start",
    "lint":            "next lint",
    "test":            "jest",
    "test:watch":      "jest --watch",
    "test:integration":"jest --config jest.integration.config.js",
    "test:coverage":   "jest --coverage",
    "check":           "npx tsc --noEmit && npm run lint && npm test",
    "db:push":         "prisma db push",
    "db:seed":         "prisma db seed",
    "db:studio":       "prisma studio",
    "db:reset":        "prisma migrate reset --force && prisma db seed",
    "db:generate":     "prisma generate",
    "supabase:types":  "supabase gen types typescript --local > src/types/database.types.ts",
    "fabric:start":    "docker compose -f fabric/network/docker-compose.yml up -d",
    "fabric:stop":     "docker compose -f fabric/network/docker-compose.yml down",
    "fabric:logs":     "docker compose -f fabric/network/docker-compose.yml logs -f peer0",
    "fabric:deploy-cc":"bash fabric/scripts/deploy-chaincode.sh",
    "cerbos:start":    "docker run --rm --name cerbos -v $(pwd)/cerbos/policies:/policies -v $(pwd)/cerbos/config.yaml:/config.yaml -p 3592:3592 -p 3593:3593 ghcr.io/cerbos/cerbos:0.38.0 server --config=/config.yaml",
    "cerbos:test":     "docker run --rm -v $(pwd)/cerbos/policies:/policies ghcr.io/cerbos/cerbos:0.38.0 compile --tests /policies",
    "bulk-import":     "npx tsx scripts/bulk-import.ts",
    "pre-launch":      "bash scripts/pre-launch-check.sh",
    "dev:all":         "concurrently \"npm run dev\" \"npm run cerbos:start\" \"npm run fabric:logs\""
  }
}
```

### VS Code / Cursor workspace settings

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": true },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": { "editor.defaultFormatter": "Prisma.prisma" },
  "files.exclude": { "**/.next": true, "**/node_modules": true }
}
```

`.vscode/extensions.json`:

```json
{
  "recommendations": [
    "Prisma.prisma",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "GitHub.copilot"
  ]
}
```

---

## Appendix G — Three-layer audit reference card

This card should be printed and kept at the developer desk and in the APCRDA IT operations room.

```
┌─────────────────────────────────────────────────────────────────┐
│            APCRDA TDR — THREE-LAYER AUDIT REFERENCE             │
└─────────────────────────────────────────────────────────────────┘

LAYER 1 — CERBOS DECISION LOG (automatic, every allow/deny)
───────────────────────────────────────────────────────────
Where: /var/log/cerbos/ on the application server
       OR Cerbos Hub dashboard (production)
Query via Cerbos Admin API:
  GET http://localhost:3592/admin/auditlog/list/KIND_DECISION?tail=50
  GET .../KIND_DECISION?lookup={cerbosCallId}
What it shows: principal (who), resource (what), action (doing what),
               policy evaluated, ALLOW/DENY, timestamp
Join key: cerbosCallId

LAYER 2 — APPLICATION AUDIT LOG (every state change)
────────────────────────────────────────────────────
Where: audit_log table in Supabase PostgreSQL
Query:
  SELECT * FROM audit_log WHERE bond_id = '{uuid}' ORDER BY id;
  SELECT * FROM audit_log WHERE cerbos_call_id = '{cerbosCallId}';
  SELECT * FROM audit_log WHERE fabric_tx_id = '{txId}';
What it shows: bond state changes, who did it, what Cerbos decided, Fabric txId
Hash chain: each row's chain_hash covers all previous rows
            verifyAuditChain() detects any tampering
Join keys: cerbos_call_id (→ Layer 1), fabric_tx_id (→ Layer 3)

LAYER 3 — HYPERLEDGER FABRIC LEDGER (immutable approvals + cert)
────────────────────────────────────────────────────────────────
Where: Fabric peer blockchain state + history
Query:
  peer chaincode query -C tdr-channel -n tdr-bond-cc \
    -c '{"function":"GetBond","Args":["TDR-2025-001"]}'

  peer chaincode query -C tdr-channel -n tdr-bond-cc \
    -c '{"function":"GetBondHistory","Args":["TDR-2025-001"]}'
What it shows: immutable record of every approval with signatureHash + cerbosCallId
Join key: cerbosCallId stored IN the chaincode record

CROSS-REFERENCE INVESTIGATION
──────────────────────────────
Given a suspect bond TDR-2025-001:

Step 1: audit_log
  SELECT * FROM audit_log WHERE bond_id = (
    SELECT id FROM tdr_bonds WHERE tdr_number = 'TDR-2025-001'
  ) ORDER BY id;
  → Note cerbos_call_id and fabric_tx_id for each row

Step 2: Cerbos (for each cerbos_call_id)
  GET /admin/auditlog/list/KIND_DECISION?lookup={cerbos_call_id}
  → Confirms who was allowed/denied and which policy applied

Step 3: Fabric (immutable ground truth)
  GetBondHistory('TDR-2025-001')
  → Confirms on-chain approval record including cerbosCallId

ALERT: If any three layers disagree on the same event → escalate to APCRDA IT security
```

---

## Appendix H — Prisma seed file

Full seed for realistic UAT and development data:

**Cursor prompt** → `prisma/seed.ts`:

```
Write a complete Prisma seed for APCRDA TDR UAT.

Create:
1. 5 officials with correct roles and Krishna district (except Commissioner):
   { employee_id: 'DEO001', name: 'Sri K. Raju', role: DEO, district_code: 'KRISHNA', phone: '9000000001' }
   { employee_id: 'TAH001', name: 'Sri P. Reddy', role: DY_TAHSILDAR, district_code: 'KRISHNA', phone: '9000000002' }
   { employee_id: 'SDC001', name: 'Sri M. Rao', role: SDC, district_code: 'KRISHNA', phone: '9000000003' }
   { employee_id: 'DIR001', name: 'Sri V. Sharma', role: DIRECTOR_LANDS, district_code: 'ALL', phone: '9000000004' }
   { employee_id: 'COM001', name: 'Sri K. Venkateswara Rao', role: COMMISSIONER, district_code: 'ALL', phone: '9000000005' }
   Generate random UUIDs for each official's id (= their Supabase user id placeholder)

2. 3 farmers with Telugu names, aadhaar_phone '9999999999', '9999999998', '9999999997'
   aadhaar_hash = SHA-256('999999999999') for all three (hex lowercase)
   aadhaar_encrypted = placeholder string 'ENCRYPTED_PLACEHOLDER'

3. 4 bonds:
   Bond A: DRAFT - farmer 1, created by DEO001, survey_no '21/2B', village 'Kanuru',
     surrendered_area_sq_yds 770, issued_ratio '1:1', tdr_extent 770,
     no documents, all 4 approval_steps PENDING
   
   Bond B: PENDING_L2 - farmer 2, created by DEO001, survey_no '36', village 'Udandarayunipaalem',
     surrendered_area_sq_yds 1540, issued_ratio '1.5:1', tdr_extent 2310,
     5 documents with placeholder ipfs_cids and supabase_storage_paths,
     approval_steps[0] APPROVED (official DEO001, signature_hash='test-hash-l1', decided_at=now()),
     approval_steps[1] PENDING, approval_steps[2..3] PENDING

   Bond C: ACTIVE - farmer 3, survey_no '142/2A', village 'Neerukonda',
     surrendered_area_sq_yds 385, issued_ratio '1:1', tdr_extent 385,
     5 documents uploaded, all 4 approval_steps APPROVED with mock signatures,
     certificate_ipfs_cid='bafybeitest123', minted_at=now() - 2days, status=ACTIVE

   Bond D: REJECTED - farmer 1 (same as A), survey_no '99/1', PENDING_L1 rejected,
     rejection_reason='Documents incomplete - ownership deed not legible'
     approval_steps[0] REJECTED with remarks

4. Also create an audit_log entry for each bond's last state change, with
   chain_hash computed properly (SHA-256 chain). Genesis hash: 'APCRDA-TDR-GENESIS-2026'

Use prisma.$transaction for all writes. Log each created record to console.
```

---

## Appendix I — Environment variable reference

Complete reference for every environment variable used in the platform.

| Variable | Required | Where used | Example | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser + Server | `https://xyz.supabase.co` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + Server | `eyJ...` | Public, safe in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | `eyJ...` | Never expose to browser — bypasses RLS |
| `DATABASE_URL` | Yes | Prisma (server) | `postgresql://...` | Direct DB connection for Prisma |
| `CERBOS_PDP_URL` | Yes | Server | `localhost:3593` | gRPC address of Cerbos PDP |
| `CERBOS_PDP_TLS` | No | Server | `false` | Set `true` in production |
| `CERBOS_ADMIN_USER` | Yes | Server | `cerbos-admin` | For querying Cerbos audit log API |
| `CERBOS_ADMIN_PASSWORD` | Yes | Server | `...` | Store in HashiCorp Vault in prod |
| `FABRIC_PEER_ENDPOINT` | Yes | Server | `localhost:7051` | Fabric peer gRPC address |
| `FABRIC_MSP_ID` | Yes | Server | `APCRDA` | MSP ID matching crypto-config.yaml |
| `FABRIC_CERT_PATH` | Yes | Server | `./fabric/...` | Admin certificate path |
| `FABRIC_KEY_PATH` | Yes | Server | `./fabric/...` | Admin private key path |
| `FABRIC_TLS_CERT_PATH` | Yes | Server | `./fabric/...` | Peer TLS CA cert path |
| `HMAC_SECRET` | Yes | Server | 32-byte hex | `openssl rand -hex 32` — rotate every 6 months |
| `AADHAAR_ENCRYPTION_KEY` | Yes | Server | 32-byte hex | `openssl rand -hex 32` — rotate with re-encryption |
| `COMMISSIONER_CERT_PATH` | Prod | Server | `./certs/...` | PKI cert for PDF digital signing |
| `COMMISSIONER_KEY_PATH` | Prod | Server | `./certs/...` | Private key for PDF signing (HSM in prod) |
| `MSG91_AUTH_KEY` | Yes | Server | `...` | SMS OTP delivery |
| `MSG91_SENDER_ID` | Yes | Server | `APCRDA` | SMS sender name (max 6 chars) |
| `MSG91_TEMPLATE_ID` | Yes | Server | `...` | Pre-approved DLT OTP template |
| `APCRDA_LAND_RECORDS_URL` | Yes | Server | `https://...` | Land Records system base URL |
| `APCRDA_GIS_URL` | Yes | Server | `https://...` | GIS portal base URL |
| `APCRDA_FARMER_URL` | Yes | Server | `https://...` | Farmer portal base URL |
| `APCRDA_OAUTH_TOKEN_URL` | Yes | Server | `https://...` | OAuth2 token endpoint |
| `APCRDA_CLIENT_ID` | Yes | Server | `tdr_platform` | OAuth2 client ID |
| `APCRDA_CLIENT_SECRET` | Yes | Server | `...` | OAuth2 client secret (Vault in prod) |
| `APCRDA_MOCK_MODE` | No | Server | `true` | Set `false` when real APIs available |
| `IPFS_API_URL` | Yes | Server | `http://localhost:5001` | IPFS daemon API URL |

---

*End of guide. Total: 28 sections + 9 appendices.*

*Version 1.0 — June 2026 — APCRDA Technology Division*
