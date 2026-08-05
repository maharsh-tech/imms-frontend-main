# IMMS Frontend — Project Context

> Living document. Updated after each epic completes.

## Quick Reference

| Property | Value |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 (Academic Core design tokens in `src/index.css`) |
| Client State | Zustand (user profile only — **no tokens in storage**) |
| HTTP Client | Axios with `withCredentials: true` (httpOnly cookies) |
| Routing | React Router v7 |
| Auth | Plan A: activation link → set password → login |
| Git Remote | https://github.com/maharsh-tech/imms-frontend-main.git (branch: main) |

## Architecture Principle — UI/UX Only

**This frontend does not implement business logic.** It renders UI, collects user input, and calls the backend API. The backend is always authoritative.

| Concern | Frontend | Backend |
|---|---|---|
| Marks validation (≤ maxMarks) | Shows API error message | Enforces in `MarksService` |
| NE / AB flag rules | Checkbox toggles → sends flag to API | Persists NE; blocks changes when locked |
| Submission workflow | Disables buttons based on `submission.status` from API | State machine + audit log |
| Student marksheet display | Renders `display` string from API | Computes NE/AB/numeric rules |
| Authorization | Route guards (UX redirect only) | JwtAuthGuard + RolesGuard on every endpoint |
| studentState | Shows NO_RECORD / UNPUBLISHED / PUBLISHED screens | Computed in `GET /auth/me` |
| Assignment semester | Auto-fills from subject; editable for backlog | Validates + stores on assignment |
| Duplicate assignment | Shows API error message | ConflictException on unique constraint |

`src/api/` is a **thin HTTP client layer** — no validation, no business rules.

## Auth Pages (Public)

| File | Route | Purpose |
|---|---|---|
| `src/pages/Login.tsx` | `/login` | Sign-in form. Posts `{ loginId, password }` to `POST /auth/login`. Students use **roll number**; staff use **@charusat.ac.in** email. Redirects by role after success. |
| `src/pages/ActivateAccount.tsx` | `/activate?token=…` | First-time password setup from coordinator activation link. Posts `{ token, newPassword }` to `POST /auth/activate`, then redirects to `/login?activated=1`. Password: min 10 chars, letter + digit. UI styled like “reset password”; this is **account activation**, not a forgot-password flow. |

> **Not yet in UI:** `POST /auth/request-password-reset` and `POST /auth/reset-password` exist on the backend but have no frontend pages yet. `GET /audit` (coordinator audit log viewer) is also backend-only.

Shared layout/components: `src/components/auth/` (`AuthShell`, `AuthCard`, `PasswordField`, `AuthAlert`).

## Project Structure

```
imms-frontend/
├── src/
│   ├── App.tsx
│   ├── index.css                    # Design tokens (Academic Core palette + typography)
│   ├── api/
│   │   ├── client.ts                # withCredentials, 401 → /auth/refresh
│   │   ├── allowedUsers.ts
│   │   ├── faculty.ts, students.ts
│   │   ├── import.ts
│   │   ├── subjects.ts
│   │   └── marks.ts
│   ├── components/
│   │   ├── AuthBootstrap.tsx
│   │   ├── auth/                    # Login + activate shared UI
│   │   ├── staff/                   # StaffShell, StaffTabBar (coordinator/teacher)
│   │   ├── student/                 # Student portal shell, SubjectCard, etc.
│   │   └── shared/                  # SubmissionStatusBadge, ExcelImportCard
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ActivateAccount.tsx
│   │   ├── coordinator/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AccountInvites.tsx
│   │   │   ├── StudentsManagement.tsx
│   │   │   ├── FacultyManagement.tsx
│   │   │   ├── SubjectsManagement.tsx
│   │   │   └── AssignmentsManagement.tsx
│   │   ├── teacher/Dashboard.tsx
│   │   ├── student/
│   │   │   ├── Marksheet.tsx
│   │   │   ├── Schedule.tsx         # Placeholder (no API yet)
│   │   │   └── Profile.tsx
│   │   └── shared/MarksGridPage.tsx
│   ├── routes/PrivateRoute.tsx, RoleRoute.tsx
│   └── stores/authStore.ts
└── context.md
```

## Routes

| Path | Role | Purpose |
|---|---|---|
| `/login` | Public | Email/roll-number + password login |
| `/activate?token=…` | Public | Set password from activation link |
| `/coordinator` | Coordinator | Tabs: accounts, students, faculty, subjects, assignments |
| `/coordinator/marks/:assignmentId/:assessmentId` | Coordinator | NE flags, lock, unlock, publish, unpublish |
| `/teacher` | Teacher | Assigned subjects → marks entry links |
| `/teacher/marks/:assignmentId/:assessmentId` | Teacher | Enter marks, AB, submit |
| `/student` | Student | Marksheet (default tab) |
| `/student/schedule` | Student | Schedule placeholder |
| `/student/profile` | Student | Account info + logout |

## UI Surfaces by Role

| Role | Shell | Notes |
|---|---|---|
| Student | `StudentShell` | Student Portal header, sidebar (desktop) / bottom nav (mobile), no profile photo |
| Coordinator / Teacher | `StaffShell` | Portal header + logout; coordinator uses scrollable `StaffTabBar` |
| Marks grid | `StaffShell` (wide) | Shared by coordinator and teacher at `/…/marks/:assignmentId/:assessmentId` |

## Implemented Features

- [x] Epic 1.1 — Project Scaffolding
- [x] Epic 1.3 — Authentication (Plan A + cookie session)
- [x] Epic 1.4 — Allowed User Management UI
- [x] Epic 1.5 — Excel Import UI
- [x] Epic 2.1 — Subject & Assessment management UI (full CRUD, search/filter)
- [x] Epic 2.2 — Subject Assignment UI (semester auto-fill, academic year, search/filter, status badges)
- [x] Epic 2.3 — Marks grid UI (NE / AB / save draft, search, summary, status badge, read-only banners)
- [x] Epic 2.4 — Submit / lock / unlock / publish / unpublish with confirm dialogs + API error feedback
- [x] Student portal UI — marksheet cards, profile, auth pages (Academic Core design)

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API (`http://localhost:3000/api/v1`) |

## Local Development

Both servers must run:

```powershell
# Terminal 1 — backend (from imms-backend, NOT frontend)
cd imms-backend
npm run start:dev

# Terminal 2 — frontend
cd imms-frontend
npm run dev
```

Open http://localhost:5173 — login fails with "Check credentials" if backend is not running (`ERR_CONNECTION_REFUSED` on port 3000).

Copy `.env.example` → `.env` and set `VITE_API_BASE_URL=http://localhost:3000/api/v1`.

Database seed runs in **backend only**: `cd imms-backend && npx prisma db seed`

## Marks Grid UX (Epic 2.3/2.4 enhancements)

`MarksGridPage.tsx`:
- `SubmissionStatusBadge` for workflow status
- Read-only banner when SUBMITTED/PUBLISHED ("View only" teacher / "Marks are locked" coordinator)
- NE rows highlighted amber for teachers; NE label shown in name column
- Client-side search by roll number / name
- Footer summary: entered · AB · NE · blank counts
- Confirm dialogs on submit, unlock, publish, unpublish
- Coordinator: **Lock Marks**, **Unlock for Teacher**, **Publish Results**, **Unpublish Results**
- PUBLISHED coordinator view: unpublish available; info banner for students
- All workflow actions show backend error messages via `apiErrorMessage`
- Marksheet uses `hasPublished` from API (not only `/auth/me` studentState)

## Coordinator: Account Management

Create student/teacher/coordinator accounts, bulk paste IDs, filter by role, copy activation links (manual delivery — no automated email UI). Roster import/add requires account first (activation not required).

**Student Excel:** CSPIT `Roll No` + `Student Name` (regular `24IT…` and diploma `D25IT…`). Set department/semester in import panel; batch auto from roll.

**Faculty Excel:** CSPIT name list (single column) matched to accounts by name, or structured sheet with email slug + name.

**Teacher accounts:** institutional email `firstnamelastname.dept@charusat.ac.in` (e.g. `nishatshaikh.it@charusat.ac.in`) — not 3-letter codes. Bulk paste one email per line.

## Subjects: Core vs Elective

- **Core** — all students in same department + semester appear on marks grid automatically
- **Elective** — coordinator imports roll numbers after create; teacher sees only enrolled students

Subjects tab: check "Elective subject" → roster modal (Excel or paste) → assign teacher in Assignments tab. Enrollment count badge on subject/assignment rows.

## Dev logins (after seed)

| Role | Login | Password |
|------|-------|----------|
| Coordinator | coordinator@charusat.ac.in | password123 |
| Teacher | dev.it@charusat.ac.in | password123 |
| Student | 23IT001 | password123 |

## Last Updated

**CSPIT Excel import, teacher email slugs, Account Management UI** (2026-08-05)

**Docs sync — backend security hardening** (2026-08-05): API spec updated for change-password (`currentPassword`), password reset endpoints, `GET /health`, and `GET /audit`. No frontend UI yet for reset or audit viewer.

**Student portal UI, auth pages, coordinator/teacher StaffShell + design tokens** (2026-08-03)
