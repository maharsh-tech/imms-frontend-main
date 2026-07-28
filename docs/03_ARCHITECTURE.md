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
│    Google OAuth 2.0          Supabase Storage (optional)    │
│    (Authentication)          (PDF/Excel file storage)       │
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
| Authentication | Google OAuth 2.0 + JWT | Institutional Google accounts, stateless tokens |
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
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── google.strategy.ts        (Passport Google OAuth)
│   │   └── jwt.strategy.ts           (JWT validation)
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
├── students/
│   ├── students.module.ts
│   ├── students.controller.ts
│   └── students.service.ts
├── faculty/
│   ├── faculty.module.ts
│   ├── faculty.controller.ts
│   └── faculty.service.ts
├── subjects/
│   ├── subjects.module.ts
│   ├── subjects.controller.ts
│   └── subjects.service.ts
├── marks/
│   ├── marks.module.ts
│   ├── marks.controller.ts
│   └── marks.service.ts
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── pdf-generator.service.ts
├── import/
│   ├── import.module.ts
│   ├── import.controller.ts
│   └── import.service.ts            (SheetJS parsing)
├── audit/
│   ├── audit.module.ts
│   └── audit.service.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
`

---

## 4. Frontend Architecture (React + Vite)

`
src/
├── main.tsx
├── App.tsx                        (Router setup)
├── routes/
│   ├── PrivateRoute.tsx           (Auth guard)
│   └── RoleRoute.tsx              (Role-based guard)
├── pages/
│   ├── Login.tsx
│   ├── coordinator/
│   │   ├── Dashboard.tsx
│   │   ├── StudentImport.tsx
│   │   ├── FacultyImport.tsx
│   │   ├── SubjectManagement.tsx
│   │   ├── SubjectAssignment.tsx
│   │   ├── MarksReview.tsx
│   │   └── ReportGeneration.tsx
│   ├── teacher/
│   │   ├── Dashboard.tsx
│   │   ├── SubjectList.tsx
│   │   └── MarksEntry.tsx
│   └── student/
│       └── Marksheet.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageWrapper.tsx
│   ├── shared/
│   │   ├── DataTable.tsx
│   │   ├── FileUpload.tsx
│   │   ├── StatusBadge.tsx         (AB / NE badges)
│   │   └── PDFDownloadButton.tsx
│   └── marks/
│       ├── MarksTable.tsx
│       └── FlagCell.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSubjects.ts
│   └── useMarks.ts
├── stores/
│   └── authStore.ts               (Zustand)
├── api/
│   └── client.ts                  (Axios instance with interceptors)
└── types/
    └── index.ts                   (Shared TypeScript types)
`

---

## 5. Authentication Flow

```
User clicks "Sign in with Google"
        |
        v
Google OAuth 2.0 Consent Screen
        |
        v (authorization code)
NestJS /auth/google/callback
        |
        v
[GATE 1] Domain Validation
  Does email end with @ALLOWED_EMAIL_DOMAIN ?
        |
  NO ---+--> 403: "Only institutional email accounts are permitted"
        |
  YES
        |
        v
[GATE 2] Whitelist Check
  Is email in AllowedUsers table?
        |
  NO ---+--> 403: "Account not registered. Contact the Exam Coordinator."
        |
  YES -> assign role (COORDINATOR / TEACHER / STUDENT)
        |
        v
Issue JWT (access 15min) + Refresh Token (7 days)
        |
        v
Frontend stores tokens -> redirect to role dashboard

        | (if role = STUDENT)
        v
[GATE 3] Student Record Lookup (by email)
        |
  NO RECORD  --> Show: "No student record linked. Contact Coordinator."
        |
  FOUND, not published --> Show: "Results not published yet."
        |
  FOUND, published --> Show full marksheet
```

---

## 6. Marks Submission Workflow

`
Teacher opens subject → status: DRAFT
        │
Teacher enters marks (validates <= max marks)
        │
Teacher flags AB students as needed
        │
Teacher clicks "Submit Marks"
        │ Confirmation dialog shown
        │
        ▼
Backend sets SubjectAssignment.status = SUBMITTED
Backend locks all mark records (isLocked = true)
Audit entry created
        │
Coordinator views submission list
        │ (if correction needed)
        ▼
Coordinator clicks "Unlock" for subject
Backend sets status = DRAFT, isLocked = false
Audit entry created: UNLOCK event
        │
Teacher re-enters → resubmits
`

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
│  ENV: DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET         │
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
| Authentication | Google OAuth 2.0 only; no password storage |
| Domain Restriction | Email domain validated against ALLOWED_EMAIL_DOMAIN env var before any other check |
| Authorization | NestJS RolesGuard + @Roles() decorator on every endpoint |
| Token Security | JWT signed with HS256 secret; short expiry |
| IDOR Prevention | All queries scoped to authenticated userId (student sees only their own data) |
| Student State | Three explicit states: no-record / unpublished / published. Never a blank screen. |
| Input Validation | class-validator DTOs on all incoming request bodies |
| SQL Injection | Prisma parameterized queries (no raw SQL) |
| CORS | Allowlist of frontend origins only |
| Rate Limiting | @nestjs/throttler on auth endpoints |
| Secrets | Environment variables; never committed to repo |

---

## 10. Scalability Considerations

- **Horizontal scaling:** NestJS is stateless; multiple instances can run behind a load balancer (Railway supports this)
- **DB connections:** Supabase PgBouncer (port 6543) handles connection pooling for up to 800 concurrent users without exhausting Postgres connections
- **Caching:** Not required at this scale; add Redis if needed in v2
- **PDF generation:** Synchronous for individual; async queue for bulk (M4)
