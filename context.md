# IMMS Frontend — Project Context

> Living document. Updated after each epic completes.

## Quick Reference

| Property | Value |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 (Academic Core design tokens in `src/index.css`) |
| Client State | Zustand (user profile only — **no tokens in storage**) |
| Server State | React Query (`src/hooks/`, 5 min staleTime on coordinator dashboard) |
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
| `src/pages/Login.tsx` | `/login` | Sign-in form. Posts `{ loginId, password }` to `POST /auth/login`. Students use **roll number**; staff use **@charusat.ac.in** email. Redirects by role after success. Post-activation success banner uses **router state only** (`auth-flash.ts`) — never URL query params. |
| `src/pages/ActivateAccount.tsx` | `/activate#token=…` | First-time password setup from coordinator activation link. Reads token from URL **hash** (`activation-token.ts`), strips it from the address bar, posts `{ token, newPassword }` to `POST /auth/activate`, then redirects to `/login` with router flash state. Password: min 10 chars, letter + digit. |

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
│   ├── hooks/
│   │   ├── useAccountInvites.ts   # List + create/delete/regenerate mutations
│   │   ├── useStudents.ts, useFaculty.ts, useSubjects.ts, useAssignments.ts
│   │   └── usePageTitle.ts
│   ├── utils/
│   │   ├── identifier-patterns.ts # Roll validation; deriveBatch/deriveDepartment from roll
│   │   ├── activation-token.ts    # Consume #token= from hash; strip URL
│   │   └── auth-flash.ts          # One-time login messages via router state
│   ├── components/
│   │   ├── AuthBootstrap.tsx
│   │   ├── auth/                    # Login + activate shared UI
│   │   ├── coordinator/
│   │   │   ├── account-invites/     # BulkInviteForm, SingleInviteForm, InviteTable, RosterDialog
│   │   │   └── subjects/            # AddSubjectForm, AddAssessmentForm, ElectiveRosterModal
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
| `/activate#token=…` | Public | Set password from activation link (hash consumed client-side) |
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
| Coordinator / Teacher | `StaffShell` | Left-aligned fixed sidebar (desktop) / slide-in drawer (mobile) with `StaffSidebar`. User info + Logout pinned to bottom |
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
- Coordinator: **Lock Marks**, **Unlock for Teacher**, **Publish Results**, **Unpublish Results**, **Save Marks** (enables editing student marks and AB checkboxes in DRAFT mode)
- Export features (coordinator only): **Download PDF** (using `jspdf` & `jspdf-autotable`) and **Download Excel** (using `exceljs` as native warning-free `.xlsx` file). NE student marks are masked in exports as a light-blue highlighted "NE" cell.
- PUBLISHED coordinator view: unpublish available; info banner for students
- All workflow actions show backend error messages via `apiErrorMessage`
- Marksheet uses `hasPublished` from API (not only `/auth/me` studentState)

## Coordinator: Account Management

Create student/teacher/coordinator accounts, bulk paste IDs, filter by role, copy activation links (manual delivery — no automated email UI). **Copy activation link** / **Copy all pending links** call `POST /allowed-users/:id/regenerate-activation-link`. Bulk creation button renamed to **Create accounts & download Excel**, which automatically generates and triggers a download of a native `.xlsx` sheet containing Student/Faculty/Coordinator IDs and activation links using `exceljs`. Listing accounts does not expose links — only `hasActivationToken`. **`isActivated` is server-computed** (from `needsPasswordChange`) — never trusted from URL params.

**Add to roster** (student accounts not yet in master roster): department and batch **auto-derive from roll number** (`deriveDepartmentFromRollNumber`, `deriveBatchFromRollNumber`); semester must be entered manually. Activation not required before roster add.

**Student Excel:** CSPIT `Roll No` + `Student Name` (regular `24IT…` and diploma `D25IT…`). Set semester in import panel; department/batch auto from roll when omitted.

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

**Coordinator workflow & UI polish** (2026-08-10):
- Login/activate brand changed to **IMMS Portal** (public auth header only; in-app role headers unchanged).
- **Student shell rebuilt for staff-shell parity**: 260px sidebar, graduation-cap branding, left-border active tabs, bottom-pinned user + Logout; mobile bottom nav retained (intentional student pattern).
- **Marks grid**: Save Changes disabled until there are edits and when locked (new minimal dirty tracking); NE/AB controls merged into one "Enter Marks" cell next to the input; filter tabs now `All / NE / AB` (was "Not NE"); inline over-`maxMarks` feedback (red border + "Max N") while typing — backend remains authoritative.
- **Locked-teacher audit**: lock == `SUBMITTED` (no separate LOCKED status); editing already gated by `isDraft`; verified fully non-editable when locked.
- **Coordinator sidebar reorder**: Subject → Exam & Assignments → Manage Faculty → Manage Student → Account Management (**Marks Entry tab deferred** by owner).
- **Add Assessment moved** from Subject tab to Exam & Assignments (button-gated, same logic; assignments bundle invalidated on success so the new exam's "Open Marks" link appears immediately). **Assign Teacher to Subject** is now a toggle button that opens the form.
- Removed deprecated unused `TEACHER_CODE_PATTERN` + `normalizeTeacherCodeInput` (frontend-only).

**Security & roster defaults** (2026-08-07):
- Activation links use URL hash (`/activate#token=…`); token posted in body, stripped from address bar.
- Login post-activation message uses router state (`auth-flash.ts`), not `?activated=1`.
- Roster dialog auto-fills department + batch from roll number; semester entered manually (no hardcoded defaults).
- Diploma batch format: `2025-2028` (3-year); B.Tech: `2024-2028` (4-year).

**Handoff Phase 2 — React Query & component split** (2026-08-07):
- Coordinator dashboard uses React Query hooks for all tab data + mutations (`useAccountInvites`, `useStudents`, `useFaculty`, `useSubjects`, `useSubjectMutations`).
- Split `AccountInvites.tsx` → `account-invites/*` components; `SubjectsManagement.tsx` → `subjects/*` components.

**Coordinator Enhancements & Spinners Removal** (2026-08-06):
- Reordered coordinator sidebar navigation tabs (Subjects & Exams is now the first landing tab).
- Removed elective enrollment count from Subjects & Exams table row badge; the count is now only visible inside the opened Roster modal view.
- Added a Publish toggle switch next to "Open Marks" in the assignments expanded row, supporting browser confirmations, error notifications in the page-level alert banner, and disabled states for draft assessments.
- Disabled up/down spin buttons on all numeric inputs globally in base CSS styles.
- Added input fields to configure `Start Roll Number` and `End Roll Number` range filters when assigning subjects to teachers.
- Rendered assigned ranges in a new "Range" column in the assignments listing and as a "Grading Range" metadata badge in the Marks Grid page header.

**Consolidated Save Action, Floating Actions Panel, & Toast Notifications** (2026-08-06):
- Consolidated individual "Save Marks" and "Save NE Flags" buttons into a single "Save Changes" action button.
- Designed a responsive, floating actions panel positioned fixed at the middle right on desktop (utilizing padding-right offset on the page wrapper to avoid overlapping table content), and as a sticky bottom bar on mobile viewports.
- Introduced custom animated self-dismissing Toast notifications to notify the user of successful or failed actions.
- Styled Excel and PDF exports with custom background fill colors: soft blue for NE, soft red for AB, and soft purple for combined AB+NE.

**Staff portal layout restructuring to vertical left-hand sidebar** (2026-08-05):
- Converted `StaffTabBar` into `StaffSidebar` rendering vertical navigation links.
- Updated `StaffShell` layout to render a sticky left vertical sidebar (260px wide) on desktop (>= 1024px) and a minimal top bar + slide-in drawer on mobile.
- Refactored `Dashboard` state to integrate with `StaffShell` for tab swapping.
- Converted creation and invite panels (Bulk Invite, Add Single Account, Add Subject, Add Assessment) into toggleable forms controlled by button triggers.

**Coordinator PDF/Excel exports, editing capabilities, and bulk invite downloads** (2026-08-05):
- Implemented PDF and Excel exporting for coordinators on the marks grid, masking NE student marks with a light-blue highlighted "NE" cell (AB marked as red "AB"). Excel downloads generate native, warning-free `.xlsx` files using `exceljs`.
- Enabled coordinators to edit student marks and AB status in `DRAFT` status and added a "Save Marks" action button.
- Replaced the Bulk Invite button with "Create accounts & download Excel" which auto-generates and downloads a native `.xlsx` sheet of created user IDs/emails and activation links.

**CSPIT Excel import, teacher email slugs, Account Management UI** (2026-08-05)

**Docs sync — backend security hardening** (2026-08-05): API spec updated for change-password (`currentPassword`), password reset endpoints, `GET /health`, and `GET /audit`. No frontend UI yet for reset or audit viewer.

**Post-audit bugfixes** (2026-08-05): Account Management copy-link flow via regenerate endpoint; activation password validation aligned (10 chars + letter + digit); logout no longer requires valid access cookie.

**Student portal UI, auth pages, coordinator/teacher StaffShell + design tokens** (2026-08-03)

## Known Issues & Performance

Phase 1 fixes shipped 2026-08-06. Handoff Phase 2 shipped 2026-08-07. Remaining frontend items:

| Priority | Issue | Location |
|---|---|---|
| **Medium** | No Error Boundaries | entire `src/` |
| **Medium** | Heavy export libs statically imported | `MarksGridPage.tsx` |
| **Medium** | No CSP / security headers on Vercel | `vercel.json` |

**Resolved in Phase 1:** bulk activation links (1 POST), paginated lists, virtualized marks grid rows.

**Resolved in Handoff Phase 2:** React Query coordinator dashboard caching; activation token in hash; login flash via router state; roll-derived roster defaults.
