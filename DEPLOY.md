# APCRDA TDR — Deployment Guide

Repository: https://github.com/sainath-666/TDR-Repo

---

## Project structure

```
TDR-Repo/
├── src/                 # Next.js app (pages, API, components)
├── prisma/              # Database schema + seed
├── cerbos/policies/     # Authorization policies
├── fabric/              # Hyperledger Fabric chaincode + network
├── deploy/nginx/        # Nginx configs
├── scripts/
│   ├── deploy.sh        # VM deployment
│   ├── docker-entrypoint.sh
│   └── sync-supabase-auth.ts
├── docker-compose.yml       # Base services
├── docker-compose.prod.yml  # Production hardening
├── docker-compose.vm.yml    # VM HTTP (port 80)
├── Dockerfile
├── .env                   # Local development
└── .env.production        # VM / production Docker
```

---

## Environment files

| File              | Used for                     |
| ----------------- | ---------------------------- |
| `.env`            | Local dev — `npm run dev`    |
| `.env.production` | VM deploy — `npm run deploy` |

Use **`.env`** for local work and **`.env.production`** on the VM. They are separate — local DB URLs, secrets, and hostnames stay in `.env`; production values stay in `.env.production`.

On VM deploy, Docker Compose automatically overrides these for the container network:

- `DATABASE_URL` → `postgresql://...@postgres:5432/...`
- `CERBOS_PDP_URL` → `cerbos:3593`

---

## Local development (Windows)

Cerbos has **no native Windows binary**. Use **WSL** (you have Ubuntu) or **Docker Desktop**.

### Step 1 — Start Cerbos (Terminal 1)

```powershell
npm run cerbos:start
```

This auto-detects:

- **Docker** → starts `cerbos` container in background
- **WSL** → downloads Linux Cerbos binary and runs it (keep terminal open)

Verify: http://localhost:3592/\_cerbos/health → should return OK

### Step 2 — Start app (Terminal 2)

```powershell
npm run dev
```

### `.env` (local)

```env
CERBOS_MOCK_MODE=false
CERBOS_PDP_URL=localhost:3593
```

### Linux / macOS

```bash
npm run cerbos:start:unix   # Terminal 1
npm run dev                 # Terminal 2
```

---

## VM deployment

### Requirements

- Ubuntu 22.04+ / Debian 12
- 4 GB RAM minimum (8 GB recommended)
- Docker installed
- Port **80** open

### Steps

**1. SSH into VM**

```bash
ssh user@YOUR_VM_IP
```

**2. Clone repo**

```bash
git clone https://github.com/sainath-666/TDR-Repo.git
cd TDR-Repo
```

**3. Configure `.env.production`**

```bash
nano .env.production
```

Fill in Supabase keys and generated secrets (see template in file).

**4. Configure Supabase**

Dashboard → Authentication → URL Configuration:

- Site URL: `http://YOUR_VM_IP`
- Redirect URLs: `http://YOUR_VM_IP/auth/callback`

**5. Deploy**

```bash
chmod +x scripts/deploy.sh
npm run deploy
```

**6. Verify**

```bash
curl http://localhost/api/health
```

Open `http://YOUR_VM_IP/` in a browser.

**7. Optional — seed + auth sync**

```bash
npm run deploy -- --seed
export DATABASE_URL="postgresql://apcrda:PASSWORD@127.0.0.1:5432/apcrda_tdr"
npm run auth:sync
```

### Operations

| Task                  | Command                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| View logs             | `npm run deploy:logs`                                                                           |
| Redeploy after update | `git pull && npm run deploy`                                                                    |
| Stop                  | `docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.vm.yml down` |

---

## HTTPS (domain + SSL)

1. Place certs in `deploy/nginx/ssl/tdr.crt` and `tdr.key`
2. In `docker-compose.vm.yml`, swap `nginx.vm.conf` for `nginx.conf` in the nginx volume
3. Expose port 443 in the nginx service
4. Update Supabase URLs to `https://your-domain`

---

## Fabric blockchain (optional)

```bash
npm run fabric:bootstrap
npm run fabric:deploy-cc
```

Set `FABRIC_MOCK_MODE=false` in `.env.production` and redeploy.

---

## Troubleshooting

| Problem                  | Solution                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Docker permission denied | `sudo usermod -aG docker $USER && newgrp docker`                       |
| Health check fails       | `npm run deploy:logs`                                                  |
| Login redirect error     | Add VM IP to Supabase redirect URLs                                    |
| Build fails              | Ensure `NEXT_PUBLIC_*` vars are set in `.env.production` before deploy |
| Port 80 blocked          | Open in cloud firewall + `sudo ufw allow 80/tcp`                       |
