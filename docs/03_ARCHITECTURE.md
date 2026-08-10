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
│  │  Tables: User, Student, Faculty, Subject, SubjectOffering,     │   │
│  │  CIERound, SubjectAssignment, Assessment, Mark, AuditLog       │   │
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
| Frontend | React 19 + Vite | Fast HMR, industry standard, excellent ecosystem |
| Styling | Tailwind CSS v4 | Design tokens in `index.css`; Academic Core student/auth UI |
| State Management | Zustand + React Query | Zustand for auth profile; React Query for coordinator dashboard reads/writes (`src/hooks/`, 5 min staleTime) |
| Backend | NestJS (Node.js) | Structured modules, built-in DI, ideal for role-based systems |
| Language | TypeScript (full stack) | Type safety, shared types possible |
| ORM | Prisma | Type-safe DB access, migrations, schema as code |
| Database | PostgreSQL (Supabase) | Managed Postgres, built-in auth (unused here), storage |
| Authentication | Email/password + activation link (Plan A); JWT in httpOnly cookies |

> **Google OAuth:** Not implemented in code. No Google OAuth routes, strategies, or env vars are used by the application.
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
├── subjects/                    # subjects.service, faculty.service, students.service
├── subject-assignments/
├── cie-rounds/                    # GET /cie-rounds (coordinator)
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
│   ├── allowedUsers.ts, faculty.ts, students.ts, import.ts, subjects.ts, marks.ts
├── hooks/                         # React Query — useAccountInvites, useStudents, useFaculty, useSubjects, useAssignmentsBundle
├── utils/
│   ├── identifier-patterns.ts     # Roll validation; deriveBatchFromRollNumber, deriveDepartmentFromRollNumber
│   ├── activation-token.ts        # Read #token= from URL hash → POST body; strip from address bar
│   └── auth-flash.ts              # One-time login success via router state (never URL query params)
├── components/
│   ├── auth/                      # AuthShell, AuthCard — login + activate
│   ├── coordinator/
│   │   ├── account-invites/       # BulkInviteForm, SingleInviteForm, InviteTable, RosterDialog
│   │   └── subjects/              # AddSubjectForm, AddAssessmentForm, ElectiveRosterModal
│   ├── student/                   # StudentShell, CIECard — CIE-first marksheet
│   └── shared/                    # StaffShell, ExcelImportCard, badges
├── pages/
│   ├── Login.tsx                  # /login
│   ├── ActivateAccount.tsx        # /activate#token=… (first-time password)
│   ├── coordinator/               # Dashboard tabs + marks grid (NE/unlock/publish)
│   ├── teacher/                   # Assignment list → marks entry
│   ├── student/                   # Marksheet, Schedule (placeholder), Profile
│   └── shared/MarksGridPage.tsx
├── routes/                        # UX guards only
└── stores/authStore.ts            # User profile — no tokens
```

### Auth UI flow

1. Coordinator creates account → activation link copied manually (`{FRONTEND_URL}/activate#token=…`).
2. User opens `/activate#token=…` → frontend reads hash, strips URL, posts token in `POST /auth/activate` body.
3. User signs in at `/login` → `Login.tsx` → `POST /auth/login` → role-based redirect. Post-activation success banner uses **router state only** (not `?activated=1`).

Student portal uses a separate shell (`StudentShell`) with marksheet / schedule / profile tabs. Coordinator and teacher use `StaffShell`.

---

## 5. Authentication Flow (Plan A — activation link)

```
Coordinator adds user (POST /allowed-users)
  → domain validated: staff @charusat.ac.in, students @charusat.edu.in
  → activation link returned (7-day JWT, one-time use)

College emails student the activation link

Student opens /activate#token=...
  → frontend consumes hash → POST /auth/activate { token, newPassword }
  → needsPasswordChange = false (server-side only — never from URL flags)

Student signs in (POST /auth/login)
  → httpOnly cookies set (access 15min + refresh 7d)
  → NO tokens in JSON or localStorage
  → Login blocked with 403 until needsPasswordChange is false (tampering ?activated= or isActivated= in URL has no effect)

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

## 6. Data model — Subject Offering + CIE Round (2026-08-10)

> **Terminology:** **CIE** = Continuous Internal Evaluation (internal exam). User-facing UI and docs say "CIE"; the Prisma model and API paths retain `Assessment` for each subject's exam in a CIE round.

Year-scoped exam data is separated from the subject catalog:

| Entity | Purpose |
|---|---|
| **Subject** | Year-agnostic catalog (code, name, dept, sem, core/elective) |
| **SubjectOffering** | One row per subject × academic year × semester |
| **CIERound** | Shared internal exam round per dept/year/sem (CIE 1, CIE 2, …; `sequence` for ordering) |
| **Assessment** | One subject's CIE exam — links offering + CIE round; holds maxMarks, examDate, examTime |
| **SubjectAssignment** | Faculty assigned to an offering (optional roll range) |
| **SubjectEnrollment** | Elective roster scoped to an offering |
| **Student.currentAcademicYear** | Derived from batch + semester; scopes marksheet/assignment visibility |

**Security scoping:**
- `assertAssessmentBelongsToAssignment` matches `assessment.subjectOfferingId` to the assignment’s offering (prevents cross-offering mark entry).
- Student marksheet and assignment queries filter by `student.currentAcademicYear` via `buildStudentAssignmentWhere`.
- Cohort queries filter students by offering academic year (`buildCohortStudentWhere`).

**Coordinator workflow:** create catalog subject → (elective) enroll rolls for a specific year/sem offering → assign teacher to offering → add CIE exam (pick/create CIE round) → marks workflow unchanged.

**Student marksheet:** `GET /marks/my-marksheet` returns `cieRounds[]` (sorted by sequence), each listing subjects with display marks — CIE-first layout (`CIECard`).

---

## 7. Marks Submission Workflow (per assessment)

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

## 8. PDF Generation Strategy

- **Individual marksheets:** Generated on-demand using @react-pdf/renderer (server-side via NestJS) or Puppeteer rendering a React HTML template.
- **Bulk export (P2):** BullMQ job queue processes batch generation, stores to temporary file, returns download link.
- **Recommended library:** Puppeteer (gives pixel-perfect HTML→PDF) for reports; pdfmake for simpler documents.

---

## 9. Deployment Architecture

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

## 10. Security Architecture

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

### Open security items

| Item | Status |
|---|---|
| Access token not re-validated against DB (15-min window after logout) | Open |
| IP spoofing in audit logs via `x-forwarded-for` | Open |
| JWT secret strength not enforced at boot | Open |
| No CSP / security headers on Vercel frontend | Open |
| Activation token in URL | **Resolved** — JWT in hash fragment (`#token=`), consumed via POST body; stripped from address bar |
| Unpatched `xlsx@0.18.5` on Excel import parser | Open |

---

## 11. Scalability & Performance Considerations

- **Horizontal scaling:** NestJS is stateless; multiple instances can run behind a load balancer (Railway supports this)
- **DB connections:** Supabase PgBouncer (port 6543) handles connection pooling for up to 800 concurrent users without exhausting Postgres connections
- **Caching:** React Query caches coordinator dashboard lists/mutations (`src/hooks/`, 5 min `staleTime`) — tab switches no longer refetch on every visit
- **PDF generation:** Synchronous for individual; async queue for bulk (M4)

### Known performance gaps (audit 2026-08-06)

These will cause slowdowns as cohort size grows beyond ~100 students:

| Area | Issue | Fix direction |
|---|---|---|
| `PUT /marks/bulk` | N+1: 2–3 DB ops per student in loop | Batch fetch + bulk audit insert |
| `PATCH /marks/flag-ne` | Scans entire cohort even for small NE changes | Diff-only updates |
| `GET /allowed-users` | N+1 token existence check per pending invite | Single `IN` query on `one_time_tokens` |
| Excel import | Per-row upsert | Batch lookup + `createMany` |
| List endpoints | No pagination on students/faculty/subjects | Add `?page=&limit=` | **Resolved** — paginated list endpoints |
| Marks grid (FE) | Full DOM table, no virtualization | `@tanstack/react-virtual` | **Resolved** |
| Copy all pending links (FE) | N API calls to regenerate | Bulk backend endpoint | **Resolved** — `POST /allowed-users/regenerate-all-pending` |
