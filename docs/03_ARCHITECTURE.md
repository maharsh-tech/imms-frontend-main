# Architecture Document
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  

---

## 1. Architecture Overview

IMMS follows a **3-tier web architecture** with a clear separation between:
- **Frontend** — React SPA (Vite)
- **Backend** — NestJS REST API
- **Data Layer** — PostgreSQL via Supabase, managed by Prisma ORM

`
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              React + Vite (Vercel / Netlify)                │
│    ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│    │  Coordinator │  │   Teacher   │  │     Student      │ │
│    │  Dashboard   │  │  Dashboard  │  │    Marksheet     │ │
│    └──────────────┘  └─────────────┘  └──────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS / REST
┌─────────────────────────────▼───────────────────────────────┐
│                       API LAYER                             │
│              NestJS (Railway / Render)                      │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Auth      │ │ Users /  │ │ Marks /  │ │  Reports /   │  │
│  │ Module    │ │ Subjects │ │ Flags    │ │  PDF Gen     │  │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌───────────┐ ┌──────────┐                                 │
│  │ Import    │ │ Audit    │                                 │
│  │ Module    │ │ Module   │                                 │
│  └───────────┘ └──────────┘                                 │
└─────────────────────────────┬───────────────────────────────┘
                              │ Prisma ORM
┌─────────────────────────────▼───────────────────────────────┐
│                      DATA LAYER                             │
│            PostgreSQL via Supabase                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables: User, Student, Faculty, Subject,            │   │
│  │  SubjectAssignment, Assessment, Mark, AuditLog       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│    Supabase PostgreSQL       (optional: Supabase Storage)   │
└─────────────────────────────────────────────────────────────┘
`

---

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, industry standard, excellent ecosystem |
| Styling | Tailwind CSS or CSS Modules | Rapid UI development |
| State Management | Zustand + React Query | Lightweight, server-state friendly |
| Backend | NestJS (Node.js) | Structured modules, built-in DI, ideal for role-based systems |
| Language | TypeScript (full stack) | Type safety, shared types possible |
| ORM | Prisma | Type-safe DB access, migrations, schema as code |
| Database | PostgreSQL (Supabase) | Managed Postgres, built-in auth (unused here), storage |
| Authentication | Email/password + activation link (Plan A); JWT in httpOnly cookies |
| PDF Generation | @react-pdf/renderer or Puppeteer | PDF marksheets and reports |
| Excel Parsing | xlsx (SheetJS) | Robust .xlsx parsing in Node.js |
| Deployment | Vercel (FE) + Railway/Render (BE) | Zero-config, free tier viable for this scale |

---

## 3. Module Architecture (NestJS)

`
src/
├── app.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       # httpOnly cookie sessions
│   ├── auth.service.ts
│   └── guards/                  # JwtAuthGuard, RolesGuard, AuthThrottleGuard
├── allowed-users/
├── import/                      # SheetJS Excel parsing
├── subjects/                    # Subject + assessment CRUD
├── subject-assignments/
├── marks/                       # Grid, bulk, NE, submit/unlock/publish, marksheet
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
`

---

## 4. Frontend Architecture (React + Vite)

**Principle: presentation layer only.** The frontend collects input, calls REST APIs, and renders responses. It does not enforce business rules — route guards are UX convenience; the backend rejects unauthorized or invalid requests.

```
src/
├── api/                           # Thin HTTP client — no business logic
│   ├── client.ts
│   ├── allowedUsers.ts, import.ts, subjects.ts, marks.ts
├── pages/
│   ├── coordinator/               # Dashboard tabs + marks grid (NE/unlock/publish)
│   ├── teacher/                   # Assignment list → marks entry
│   ├── student/Marksheet.tsx      # Renders backend-computed display values
│   └── shared/MarksGridPage.tsx
├── routes/                        # UX guards only
└── stores/authStore.ts            # User profile — no tokens
```

---

## 5. Authentication Flow (Plan A — activation link)

```
Coordinator adds user (POST /allowed-users)
  → domain validated: staff @charusat.ac.in, students @charusat.edu.in
  → activation link returned (7-day JWT, one-time use)

College emails student the activation link

Student opens /activate?token=...
  → POST /auth/activate { token, newPassword }
  → needsPasswordChange = false

Student signs in (POST /auth/login)
  → httpOnly cookies set (access 15min + refresh 7d)
  → NO tokens in JSON or localStorage

Frontend calls GET /auth/me (cookies sent automatically)
  → redirect to role dashboard

        | (if role = STUDENT)
        v
Student record lookup (by email)
  NO RECORD  → "Contact Coordinator"
  FOUND      → marksheet (when published)
```

**Security:** helmet, rate limiting on /auth, RBAC on all endpoints, cookies HttpOnly+SameSite=Strict.

---

## 6. Marks Submission Workflow (per assessment)

```
Coordinator flags NE (optional) → status: DRAFT
        │
Teacher enters marks + AB flags
        │
Teacher POST /marks/submit → SUBMITTED (audit log)
        │
Coordinator PATCH /marks/unlock → DRAFT (if correction needed)
        │
Coordinator PATCH /marks/publish → PUBLISHED
        │
Student GET /marks/my-marksheet → sees display values (NE/AB/number)
```

All state transitions validated server-side in `MarksService`.

---

## 7. PDF Generation Strategy

- **Individual marksheets:** Generated on-demand using @react-pdf/renderer (server-side via NestJS) or Puppeteer rendering a React HTML template.
- **Bulk export (P2):** BullMQ job queue processes batch generation, stores to temporary file, returns download link.
- **Recommended library:** Puppeteer (gives pixel-perfect HTML→PDF) for reports; pdfmake for simpler documents.

---

## 8. Deployment Architecture

`
┌─────────────────────────────────────────────────────────────────┐
│  Vercel                                                         │
│  React SPA (static build)                                       │
│  Domain: imms.yourdomain.com                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS API calls
┌────────────────────────────▼────────────────────────────────────┐
│  Railway / Render                                               │
│  NestJS Docker Container                                        │
│  PORT: 3000                                                     │
│  ENV: DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET, FRONTEND_URL  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma connection pool
┌────────────────────────────▼────────────────────────────────────┐
│  Supabase                                                       │
│  PostgreSQL (managed)                                           │
│  PgBouncer connection pooling (port 6543)                       │
└─────────────────────────────────────────────────────────────────┘
`

---

## 9. Security Architecture

| Concern | Implementation |
|---|---|
| Authentication | Email/password + activation link; JWT in httpOnly cookies |
| Domain Restriction | `@charusat.ac.in` (staff) / `@charusat.edu.in` (students) — backend validator |
| Authorization | NestJS RolesGuard + @Roles() on every endpoint |
| Token Security | httpOnly + SameSite=Strict cookies; no tokens in client JS |
| Business Logic | **Backend only** — frontend renders API responses, no rule enforcement |
| IDOR Prevention | All queries scoped to authenticated userId |
| Student State | `NO_RECORD` / `UNPUBLISHED` / `PUBLISHED` computed in `GET /auth/me` |
| Input Validation | class-validator DTOs on all request bodies |
| SQL Injection | Prisma parameterized queries |
| CORS | Allowlist of frontend origins, credentials enabled |
| Rate Limiting | @nestjs/throttler on auth endpoints |
| HTTP Headers | helmet() |

---

## 10. Scalability Considerations

- **Horizontal scaling:** NestJS is stateless; multiple instances can run behind a load balancer (Railway supports this)
- **DB connections:** Supabase PgBouncer (port 6543) handles connection pooling for up to 800 concurrent users without exhausting Postgres connections
- **Caching:** Not required at this scale; add Redis if needed in v2
- **PDF generation:** Synchronous for individual; async queue for bulk (M4)
