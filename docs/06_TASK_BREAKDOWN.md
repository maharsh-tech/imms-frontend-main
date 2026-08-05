# Task / Feature Breakdown
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Format:** Milestone > Epic > Task (with estimated hours)

---

## Milestone 1 — Foundation
*Goal: Project setup, authentication, and user/data import working end-to-end*

### Status (2026-07-29)

| Epic | Status | Notes |
|------|--------|-------|
| 1.1 Project Scaffolding | ✅ Done | NestJS + React/Vite |
| 1.2 Database Schema | ✅ Done | Prisma schema + minimal seed (3 dev accounts) |
| 1.3 Authentication | ✅ Done | Plan A activation link, httpOnly cookies, domain rules |
| 1.4 Allowed Users | ✅ Done | Coordinator CRUD + activation link copy |
| 1.5 Excel Import | ✅ Done | Config-driven columns — edit `import-columns.config.ts` to change format |

**Milestone 1: Complete** (pending your testing)

---

### Epic 1.1 — Project Scaffolding

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 1.1.1 | Initialize NestJS project (
est new imms-backend) | 1h | Backend |
| 1.1.2 | Configure ESLint, Prettier, strict TypeScript | 1h | Backend |
| 1.1.3 | Setup Prisma with Supabase DATABASE_URL | 1h | Backend |
| 1.1.4 | Initialize React + Vite project (imms-frontend) | 1h | Frontend |
| 1.1.5 | Configure React Router, Zustand, React Query | 1h | Frontend |
| 1.1.6 | Setup environment variable management (.env files) | 0.5h | Both |
| 1.1.7 | Setup Git repository with .gitignore | 0.5h | Both |
| 1.1.8 | Create shared types package or 	ypes/index.ts | 1h | Both |

**Total: ~7h**

---

### Epic 1.2 — Database Schema

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 1.2.1 | Write Prisma schema (all models from DB design doc) | 2h | Backend |
| 1.2.2 | Run initial migration and seed coordinator account | 1h | Backend |
| 1.2.3 | Create Prisma service module (NestJS global) | 0.5h | Backend |
| 1.2.4 | Write seed script for test data | 1.5h | Backend |

**Total: ~5h**

---

### Epic 1.3 — Authentication

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 1.3.1 | Implement activation token issuance when coordinator adds allowed user | 1h | Backend |
| 1.3.2 | Implement `POST /auth/activate` (set password, create User from AllowedUser) | 2h | Backend |
| 1.3.3 | Implement email/password login with AllowedUser whitelist + domain checks | 2h | Backend |
| 1.3.4 | Implement JWT access token issuance (15min expiry) | 1h | Backend |
| 1.3.5 | Implement refresh token storage and rotation | 1.5h | Backend |
| 1.3.6 | Implement JWT guard and RolesGuard | 1.5h | Backend |
| 1.3.7 | **Domain restriction**: validate email domain matches role before login | 1h | Backend |
| 1.3.8 | **Student identity matching**: after student auth, query Student table by email; return studentState (NO_RECORD / UNPUBLISHED / PUBLISHED) | 1.5h | Backend |
| 1.3.9 | `GET /auth/me` endpoint | 0.5h | Backend |
| 1.3.10 | `POST /auth/logout` endpoint | 0.5h | Backend |
| 1.3.11 | Frontend: Login page (email/password) | 1h | Frontend |
| 1.3.12 | Frontend: Activate account page (`/activate?token=…`) | 1.5h | Frontend |
| 1.3.13 | Frontend: Axios interceptor for auto-refresh on 401 | 1.5h | Frontend |
| 1.3.14 | Frontend: PrivateRoute and RoleRoute components | 1h | Frontend |
| 1.3.15 | Frontend: Zustand auth store (user state, logout) | 1h | Frontend |
| 1.3.16 | **Frontend: Student state screen** — render correct message for NO_RECORD, UNPUBLISHED, or PUBLISHED states (never blank page) | 1.5h | Frontend |

**Total: ~14h**

---

### Epic 1.4 — Allowed User Management

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 1.4.1 | POST /allowed-users — add email to whitelist | 1h | Backend |
| 1.4.2 | GET /allowed-users — list with filter/pagination | 1h | Backend |
| 1.4.3 | DELETE /allowed-users/:id — remove from whitelist | 0.5h | Backend |
| 1.4.4 | Frontend: Allowed Users management page (Coordinator) | 2h | Frontend |

**Total: ~4.5h**

---

### Epic 1.5 — Excel Import

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 1.5.1 | Install SheetJS (xlsx) and create import service | 1h | Backend |
| 1.5.2 | POST /students/import — parse, validate, upsert | 3h | Backend |
| 1.5.3 | POST /faculty/import — parse, validate, upsert | 2h | Backend |
| 1.5.4 | Return import result (imported/skipped/errors) | 1h | Backend |
| 1.5.5 | Create downloadable Excel templates for both imports | 1h | Backend |
| 1.5.6 | Frontend: File upload component (drag-and-drop) | 2h | Frontend |
| 1.5.7 | Frontend: Student import page with result feedback | 1.5h | Frontend |
| 1.5.8 | Frontend: Faculty import page with result feedback | 1h | Frontend |

**Total: ~12.5h**

---

**Milestone 1 Total: ~43h**

---

## Milestone 2 — Core Marks System
*Goal: Subject management, assignment, marks entry, AB/NE flagging, submission workflow*

### Status (2026-07-29)

| Epic | Status | Notes |
|------|--------|-------|
| 2.1 Subject Management | ✅ Done | Full CRUD + assessments; edit/delete UI, credit hours, exam schedule, search/filter |
| 2.2 Subject Assignment | ✅ Done | Semester auto-fill, academic year input, search/filter, status badges |
| 2.3 Marks Entry | ✅ Done | Grid, bulk save, NE/AB — all validation on backend |
| 2.4 Submission Workflow | ✅ Done | DRAFT → SUBMITTED → PUBLISHED + unlock + audit |

**Milestone 2: Complete** (pending your testing)

> Frontend is UI/UX only. All business rules enforced in NestJS services.

---

### Epic 2.1 — Subject Management

### Status (2026-07-29)

**Epic 2.1: Complete**

| # | Task | Status |
|---|---|---|
| 2.1.1 | POST /subjects — create subject | ✅ Done |
| 2.1.2 | GET /subjects — list with filters | ✅ Done |
| 2.1.3 | PATCH /subjects/:id — update subject | ✅ Done |
| 2.1.4 | DELETE /subjects/:id — with marks existence check | ✅ Done |
| 2.1.5 | POST /subjects/:id/assessments — add assessment | ✅ Done |
| 2.1.6 | GET /subjects/:id/assessments | ✅ Done |
| 2.1.7 | Frontend: Subject management CRUD page | ✅ Done |
| 2.1.8 | Frontend: Assessment configuration per subject | ✅ Done |

> Enhancements shipped: assessment PATCH/DELETE, credit hours, exam date/time, search/filter UI.

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 2.1.1 | POST /subjects — create subject | 1h | Backend |
| 2.1.2 | GET /subjects — list with filters | 1h | Backend |
| 2.1.3 | PATCH /subjects/:id — update subject | 0.5h | Backend |
| 2.1.4 | DELETE /subjects/:id — with marks existence check | 1h | Backend |
| 2.1.5 | POST /subjects/:id/assessments — add assessment to subject | 1h | Backend |
| 2.1.6 | GET /subjects/:id/assessments | 0.5h | Backend |
| 2.1.7 | Frontend: Subject management CRUD page | 3h | Frontend |
| 2.1.8 | Frontend: Assessment configuration per subject | 2h | Frontend |

**Total: ~10h**

---

### Epic 2.2 — Subject Assignment

### Status (2026-07-29)

**Epic 2.2: Complete**

| # | Task | Status |
|---|---|---|
| 2.2.1 | POST /subject-assignments — assign faculty to subject | ✅ Done |
| 2.2.2 | GET /subject-assignments — coordinator view | ✅ Done |
| 2.2.3 | GET /subject-assignments/my — teacher view (own only) | ✅ Done |
| 2.2.4 | DELETE /subject-assignments/:id — before entry starts | ✅ Done |
| 2.2.5 | Frontend: Subject assignment page (coordinator) | ✅ Done |
| 2.2.6 | Frontend: Teacher subject list (teacher dashboard) | ✅ Done |

> Enhancements shipped: semester auto-fill from subject, academic year input/filter, search/filter UI, submission status badges, error feedback.

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 2.2.1 | POST /subject-assignments — assign faculty to subject | 1h | Backend |
| 2.2.2 | GET /subject-assignments — coordinator view | 1h | Backend |
| 2.2.3 | GET /subject-assignments/my — teacher view (own only) | 0.5h | Backend |
| 2.2.4 | DELETE /subject-assignments/:id — before entry starts | 0.5h | Backend |
| 2.2.5 | Frontend: Subject assignment page (coordinator) | 2.5h | Frontend |
| 2.2.6 | Frontend: Teacher subject list (teacher dashboard) | 1.5h | Frontend |

**Total: ~7h**

---

### Epic 2.3 — Marks Entry

### Status (2026-07-30)

**Epic 2.3: Complete**

| # | Task | Status |
|---|---|---|
| 2.3.1 | GET /marks?subjectAssignmentId=... — fetch marks grid | ✅ Done |
| 2.3.2 | PUT /marks — upsert single mark with validation | ⏭ Skipped (bulk covers use case) |
| 2.3.3 | PUT /marks/bulk — batch upsert (atomic) | ✅ Done |
| 2.3.4 | Validate: marks <= maxMarks; null if AB/NE | ✅ Done |
| 2.3.5 | Validate: marks locked check | ✅ Done |
| 2.3.6 | PATCH /marks/flag-ne — NE flagging (coordinator) | ✅ Done |
| 2.3.7 | Frontend: Marks entry table (editable spreadsheet-like grid) | ✅ Done |
| 2.3.8 | Frontend: AB flag toggle per cell | ✅ Done |
| 2.3.9 | Frontend: Real-time validation (marks exceed max) | ⏭ Skipped (backend authoritative) |
| 2.3.10 | Frontend: Auto-save draft on blur/change | ⏭ Skipped (manual Save Draft sufficient) |
| 2.3.11 | Frontend: NE flag UI for coordinator | ✅ Done |

> Enhancements shipped: cohort validation on bulk/NE writes, assessment-assignment linkage checks, NE authority (coordinator-only), transactional bulk save, no side-effect on GET grid, search/filter UI, entry summary counts, NE row highlight for teachers, read-only banners, shared status badge.

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 2.3.1 | GET /marks?subjectAssignmentId=... — fetch marks grid | 1.5h | Backend |
| 2.3.2 | PUT /marks — upsert single mark with validation | 2h | Backend |
| 2.3.3 | PUT /marks/bulk — batch upsert (atomic) | 2h | Backend |
| 2.3.4 | Validate: marks <= maxMarks; null if AB/NE | 1h | Backend |
| 2.3.5 | Validate: marks locked check | 0.5h | Backend |
| 2.3.6 | PATCH /marks/flag-ne — NE flagging (coordinator) | 1h | Backend |
| 2.3.7 | Frontend: Marks entry table (editable spreadsheet-like grid) | 5h | Frontend |
| 2.3.8 | Frontend: AB flag toggle per cell | 1.5h | Frontend |
| 2.3.9 | Frontend: Real-time validation (marks exceed max) | 1h | Frontend |
| 2.3.10 | Frontend: Auto-save draft on blur/change | 2h | Frontend |
| 2.3.11 | Frontend: NE flag UI for coordinator | 1h | Frontend |

**Total: ~18.5h**

---

### Epic 2.4 — Submission Workflow

### Status (2026-07-30)

**Epic 2.4: Complete**

| # | Task | Status |
|---|---|---|
| 2.4.1 | POST /marks/submit/:subjectAssignmentId — lock and submit | ✅ Done |
| 2.4.2 | PATCH /subject-assignments/:id/unlock — coordinator unlock | ✅ Done |
| 2.4.3 | Audit log entry on submit and unlock events | ✅ Done |
| 2.4.4 | Frontend: Submit button with confirmation dialog | ✅ Done |
| 2.4.5 | Frontend: Submission status badges (Draft/Submitted/Locked) | ✅ Done |
| 2.4.6 | Frontend: Coordinator unlock button with confirmation | ✅ Done |

> Enhancements shipped: audit log IP + previous/new status on submit/unlock/publish, confirm dialogs on unlock/publish, PUBLISHED info message (no action buttons), API error feedback on all workflow actions.

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 2.4.1 | POST /marks/submit/:subjectAssignmentId — lock and submit | 1.5h | Backend |
| 2.4.2 | PATCH /subject-assignments/:id/unlock — coordinator unlock | 1h | Backend |
| 2.4.3 | Audit log entry on submit and unlock events | 1h | Backend |
| 2.4.4 | Frontend: Submit button with confirmation dialog | 1.5h | Frontend |
| 2.4.5 | Frontend: Submission status badges (Draft/Submitted/Locked) | 1h | Frontend |
| 2.4.6 | Frontend: Coordinator unlock button with confirmation | 1h | Frontend |

**Total: ~7h**

---

**Milestone 2 Total: ~42.5h**

---

## Milestone 3 — Reporting and PDF
*Goal: Marksheet calculation, PDF generation, student self-service view*

---

### Epic 3.1 — Calculation Engine

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 3.1.1 | Service: calculate totalMarks, percentage per student per subject | 2h | Backend |
| 3.1.2 | Service: determine pass/fail per subject (incl. AB/NE = Fail) | 1h | Backend |
| 3.1.3 | Service: determine overall result | 0.5h | Backend |
| 3.1.4 | Unit tests for calculation service | 2h | Backend |

**Total: ~5.5h**

---

### Epic 3.2 — Reports API

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 3.2.1 | GET /reports/marksheet/:studentId — JSON marksheet | 2h | Backend |
| 3.2.2 | GET /reports/semester — semester-wide report JSON | 2h | Backend |
| 3.2.3 | GET /reports/subject/:id — subject-wise report JSON | 1.5h | Backend |
| 3.2.4 | Student IDOR guard: students can only query their own ID | 1h | Backend |

**Total: ~6.5h**

---

### Epic 3.3 — PDF Generation

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 3.3.1 | Setup Puppeteer or pdfmake in NestJS | 1.5h | Backend |
| 3.3.2 | Design marksheet HTML/PDF template | 3h | Backend |
| 3.3.3 | Design semester report PDF template | 2h | Backend |
| 3.3.4 | Design subject report PDF template | 1.5h | Backend |
| 3.3.5 | GET /reports/marksheet/:studentId/pdf endpoint | 1h | Backend |
| 3.3.6 | GET /reports/semester/pdf endpoint | 1h | Backend |
| 3.3.7 | GET /reports/subject/:id/pdf endpoint | 1h | Backend |

**Total: ~11h**

---

### Epic 3.4 — Coordinator Report UI

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 3.4.1 | PATCH /subject-assignments/:id/publish — publish results | 0.5h | Backend |
| 3.4.2 | Frontend: Report generation dashboard (coordinator) | 3h | Frontend |
| 3.4.3 | Frontend: Student search + individual marksheet preview | 2h | Frontend |
| 3.4.4 | Frontend: PDF download buttons | 1h | Frontend |
| 3.4.5 | Frontend: Semester-wise report view + PDF download | 2h | Frontend |

**Total: ~8.5h**

---

### Epic 3.5 — Student Self-Service

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 3.5.1 | Frontend: Student dashboard (marksheet view) | 3h | Frontend |
| 3.5.2 | Frontend: Subject-wise marks table with flags | 1.5h | Frontend |
| 3.5.3 | Frontend: Overall result summary card | 1h | Frontend |
| 3.5.4 | Frontend: PDF download button (self-marksheet) | 0.5h | Frontend |
| 3.5.5 | Frontend: Blocked view if results not published yet | 0.5h | Frontend |

**Total: ~6.5h**

---

**Milestone 3 Total: ~38h**

---

## Milestone 4 — Audit, Polish, and Deployment
*Goal: Audit trail, QA, notifications (optional), production deployment*

---

### Epic 4.1 — Audit Trail

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 4.1.1 | Audit service: log on every mark INSERT/UPDATE/DELETE | 2h | Backend |
| 4.1.2 | GET /audit — filtered, paginated | 1.5h | Backend |
| 4.1.3 | Frontend: Audit log viewer (coordinator) | 2.5h | Frontend |

**Total: ~6h**

---

### Epic 4.2 — Quality Assurance

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 4.2.1 | Integration tests for auth flow | 2h | Backend |
| 4.2.2 | Integration tests for marks entry and submission | 2h | Backend |
| 4.2.3 | E2E test: teacher marks entry → submit → coordinator unlock | 2h | Both |
| 4.2.4 | E2E test: student marksheet view and PDF download | 1h | Both |
| 4.2.5 | Security test: IDOR check on student endpoints | 1h | Backend |
| 4.2.6 | Cross-browser testing (Chrome, Firefox, Edge) | 2h | Frontend |

**Total: ~10h**

---

### Epic 4.3 — Deployment

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 4.3.1 | Configure Railway/Render for NestJS (Dockerfile) | 2h | Backend |
| 4.3.2 | Configure Vercel for React frontend | 1h | Frontend |
| 4.3.3 | Set environment variables on all platforms | 0.5h | Both |
| 4.3.4 | Run production Prisma migrations on Supabase | 0.5h | Backend |
| 4.3.5 | Configure custom domain (if applicable) | 0.5h | Both |
| 4.3.6 | Smoke test production environment | 1h | Both |

**Total: ~5.5h**

---

### Epic 4.4 — Optional: Email Notifications (P2)

| # | Task | Est. Hours | Owner |
|---|---|---|---|
| 4.4.1 | Configure Nodemailer or SendGrid | 1h | Backend |
| 4.4.2 | Email on results publication to all students in semester | 2h | Backend |
| 4.4.3 | Email template design | 1h | Backend |

**Total: ~4h (optional)**

---

**Milestone 4 Total: ~21.5h (+ 4h optional)**

---

## Summary

| Milestone | Description | Est. Hours |
|---|---|---|
| M1 | Foundation (setup, auth, import) | 43h |
| M2 | Core marks system | 42.5h |
| M3 | Reporting and PDF | 38h |
| M4 | Audit, QA, deployment | 21.5h |
| **Total** | **Full v1.0** | **~145h** |

> Assuming 2 developers (1 FE, 1 BE) working 6h/day: approximately **12 working days** to complete v1.0.

---

## Priority Legend
- **P0** — Must have in v1.0 release
- **P1** — Should have; include if time permits
- **P2** — Nice to have; can defer to v1.1
