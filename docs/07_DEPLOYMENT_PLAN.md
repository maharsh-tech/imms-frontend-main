# Deployment Plan
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Target Scale:** 500–800 users

---

## 1. Architecture Summary

- **Frontend**: React SPA on Vercel (global CDN)
- **Backend**: NestJS Docker container on Railway
- **Database**: PostgreSQL on Supabase with PgBouncer

Domain routing:
- `imms.yourdomain.com`      → Vercel (React SPA)
- `api.imms.yourdomain.com`  → Railway (NestJS API)

---

## 2. Platform Choices

| Layer | Platform | Plan | Monthly Cost |
|---|---|---|---|
| Frontend | Vercel | Hobby (Free) | $0 |
| Backend | Railway | Starter | $5–$15 |
| Database | Supabase | Pro | $25 |
| Domain | Cloudflare | Free | ~$1/yr |

> **Supabase Pro is required for production** — higher connection limits and daily automated backups.

---

## 3. Environment Strategy

| Environment | Purpose | Branch |
|---|---|---|
| development | Local dev, rapid iteration | feature/* |
| staging | Integration testing | develop |
| production | Live system | main |

---

## 4. Environment Variables

### Backend (Railway Dashboard)

```env
# Database
DATABASE_URL=postgresql://USER:PASS@db.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASS@db.supabase.co:5432/postgres

# Auth
JWT_SECRET=<strong-random-64-chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<another-strong-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://imms.yourdomain.com
CORS_ORIGINS=https://imms.yourdomain.com
```

### Frontend (Vercel)

```env
VITE_API_BASE_URL=https://api.imms.yourdomain.com/api/v1
```

> **IMPORTANT:** Never commit `.env` files to Git. Use `.env.example` templates only.

---

## 5. Prisma + Supabase PgBouncer Configuration

Supabase requires two connection URLs in `prisma/schema.prisma`:

- **url** (`DATABASE_URL`): PgBouncer pooled, port **6543** — used for all runtime queries
- **directUrl** (`DIRECT_URL`): Direct connection, port **5432** — used only for migrations

**CRITICAL:** Always run `prisma migrate deploy` using `DIRECT_URL`, never the pooled URL.

---

## 6. Dockerfile (NestJS Backend)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 7. CI/CD Pipeline (GitHub Actions)

### Backend — `.github/workflows/backend.yml`

**Trigger:** push to `main` or `develop`, changes in `backend/` folder.

**Jobs:**
1. **test** — checkout, Node 20, `npm ci`, `npm run test`
2. **deploy** (main only) — deploy to Railway via `bervProject/railway-deploy` action
   - Requires `RAILWAY_TOKEN` in GitHub Secrets

### Frontend — `.github/workflows/frontend.yml`

**Trigger:** push to `main`, changes in `frontend/` folder.

**Jobs:**
1. **deploy** — checkout, Node 20, `npm ci`, `npm run build`, deploy via `amondnet/vercel-action`
   - Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Secrets

> Note: In the YAML files, use `${{ secrets.RAILWAY_TOKEN }}` syntax for secret references.

---

## 8. Database Migration Strategy

### Development

```bash
npx prisma migrate dev --name describe_your_change
```

### Production (run before every backend deploy)

```bash
# Uses DIRECT_URL (not pooled connection)
npx prisma migrate deploy
```

### Rules
1. **NEVER** use `prisma migrate reset` in production
2. **ALWAYS** test migrations on staging before production
3. **BACKUP** database before any destructive migration
4. Never manually edit files inside `prisma/migrations/`

---

## 9. Step-by-Step First Deployment

### Step 1: Supabase Setup
1. Create project at supabase.com
2. Project Settings → Database → Connection String
3. Copy **URI** (port 5432) → set as `DIRECT_URL`
4. Copy **Pooled URI** (port 6543) → set as `DATABASE_URL`
5. Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL`

### Step 2: Railway Backend
1. Create account at railway.app
2. New Project → Deploy from GitHub → select `imms` repo
3. Set root directory to `backend/`
4. Add ALL environment variables from Section 4
5. Railway detects Dockerfile and builds automatically
6. Assign custom domain: `api.imms.yourdomain.com`

### Step 3: Database Migrations
```bash
# Run from local machine with DIRECT_URL in your local .env:
npx prisma migrate deploy

# Seed initial coordinator email into allowed_users table:
npx prisma db seed
```

### Step 4: Vercel Frontend
1. Import repo at vercel.com
2. Framework: **Vite** | Root dir: `frontend/` | Output dir: `dist/`
3. Add `VITE_API_BASE_URL`
4. Deploy and assign custom domain: `imms.yourdomain.com`

### Step 5: Run Smoke Tests (Section 11)

---

## 10. Scaling Plan for 500–800 Users

| Supabase Tier | Direct Connections | With PgBouncer | Use |
|---|---|---|---|
| Free | 60 | ~200 effective | Dev / Staging |
| Pro | 200 | ~800 effective | Production |

**Peak load scenario:** All 50 teachers submitting simultaneously + 800 students checking results.

Mitigations already in place:
- PgBouncer handles connection spikes (DATABASE_URL port 6543)
- Stateless NestJS — Railway can scale to multiple replicas with zero config change
- React SPA on Vercel CDN — zero backend load for static assets

**Future v2 (2000+ users):**
- Add Redis for session caching and rate limiting
- Move bulk PDF generation to BullMQ async job queue
- Add Supabase read replica for heavy report queries

---

## 11. Smoke Test Checklist (Post-Deploy)

Run after every production deployment:

**Authentication and Domain Restriction**
- [ ] Coordinator logs in with institutional email/password → coordinator dashboard
- [ ] Teacher logs in → sees only assigned subjects
- [ ] Student logs in → sees marksheet or appropriate state message (NOT blank screen)
- [ ] Login with non-institutional email (e.g. @gmail.com) → domain blocked error shown
- [ ] Institutional email not in whitelist → access denied message shown (NOT blank screen)
- [ ] Logout clears session and redirects to login page

**Student State Screens**
- [ ] Student email NOT in Student table → shows "Your account is not linked to any student record. Contact the Coordinator."
- [ ] Student record exists, results not published → shows "Results have not been published yet."
- [ ] Student record exists, results published → shows full marksheet

**Coordinator Flows**
- [ ] Upload student Excel → correct import count displayed
- [ ] Upload faculty Excel → correct import count displayed
- [ ] Create subject with assessments
- [ ] Assign subject to teacher
- [ ] Flag a student as NE

**Teacher Flows**
- [ ] Teacher sees ONLY their assigned subjects (not others)
- [ ] Enter valid marks → saved successfully
- [ ] Enter marks exceeding max → validation error shown
- [ ] Flag student AB → saved correctly
- [ ] Submit marks → confirmation dialog → marks locked after confirm

**Coordinator Unlock**
- [ ] Coordinator unlocks a submitted subject
- [ ] Teacher can re-edit after unlock
- [ ] Audit log records the unlock event

**Student IDOR Check**
- [ ] Student views ONLY their own marksheet
- [ ] Accessing another student's ID via URL → 403 error
- [ ] PDF download produces correct marksheet

**Reports**
- [ ] Individual PDF generates in under 5 seconds
- [ ] Semester report PDF generates correctly
- [ ] Subject report PDF generates correctly
- [ ] Audit log shows full mark change history

---

## 12. Rollback Plan

| Scenario | Action | Recovery Time |
|---|---|---|
| Bad backend deploy | Railway: one-click revert to previous deployment | < 5 min |
| Bad DB migration | Restore Supabase daily backup (Pro plan) | < 30 min |
| Frontend issue | Vercel: instant rollback to previous deployment | < 2 min |
| Full outage | Notify via institution email with ETA | < 2 hours |

---

## 13. Production Security Checklist

- [ ] HTTPS enforced on all routes (Vercel and Railway enforce by default)
- [ ] `JWT_SECRET` minimum 64 chars — generate: `openssl rand -base64 64`
- [ ] Role-specific email domains enforced at registration and login
- [ ] `CORS_ORIGINS` set to exact frontend URL — NOT wildcard `*`
- [ ] Rate limiting on `/auth` endpoints enabled (`@nestjs/throttler`)
- [ ] `DATABASE_URL` never exposed to frontend build or logs
- [ ] No `console.log` of tokens, passwords, or student PII in production
- [ ] Error responses return generic messages only — no stack traces exposed
- [ ] `.env` files listed in `.gitignore`
- [ ] Supabase Row-Level Security disabled (handled entirely at API layer by NestJS guards)

---

## 14. Monitoring (Free Tier)

| Tool | What It Monitors | Cost |
|---|---|---|
| Railway dashboard | CPU, memory, request logs, deploy history | Free |
| Supabase dashboard | Query performance, connection count | Free |
| Vercel Analytics | Page views, web vitals, error rates | Free (basic) |
| UptimeRobot | API ping every 5 min, email alert on downtime | Free |

**UptimeRobot target:** `https://api.imms.yourdomain.com/api/v1/health`

Add health check endpoint to NestJS:

```typescript
// src/app.controller.ts
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```
