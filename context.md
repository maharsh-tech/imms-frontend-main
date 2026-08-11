# IMMS Frontend â€” Project Context

> Living document. Updated after each epic completes.
>
> **CIE** = Continuous Internal Evaluation (internal exam). User-facing labels say "CIE"; code and API paths retain `Assessment` as the model/route name.

## Quick Reference

| Property | Value |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 (Academic Core design tokens in `src/index.css`) |
| Client State | Zustand (user profile only â€” **no tokens in storage**) |
| Server State | React Query (`src/hooks/`, 5 min staleTime on coordinator dashboard) |
| HTTP Client | Axios with `withCredentials: true` (httpOnly cookies) |
| Routing | React Router v7 |
| Auth | Password login (test accounts) + optional Google OAuth; httpOnly cookies; single concurrent session |
| Git Remote | https://github.com/maharsh-tech/imms-frontend-main.git (branch: main) |

## Architecture Principle â€” UI/UX Only

**This frontend does not implement business logic.** It renders UI, collects user input, and calls the backend API. The backend is always authoritative.

| Concern | Frontend | Backend |
|---|---|---|
| Marks validation (â‰¤ maxMarks) | Shows API error message | Enforces in `MarksService` |
| NE / AB flag rules | Checkbox toggles â†’ sends flag to API | Persists NE; blocks changes when locked |
| Submission workflow | Disables buttons based on `submission.status` from API | State machine + audit log |
| Student marksheet display | Renders `display` string from API | Computes NE/AB/numeric rules |
| Authorization | Route guards (UX redirect only) | JwtAuthGuard + RolesGuard on every endpoint |
| studentState | Shows NO_RECORD / UNPUBLISHED / PUBLISHED screens | Computed in `GET /auth/me` |
| Assignment semester | Auto-fills from subject; editable for backlog | Validates + stores on assignment |
| Duplicate assignment | Shows API error message | ConflictException on unique constraint |

`src/api/` is a **thin HTTP client layer** â€” no validation, no business rules.

## Auth Pages (Public)

| File | Route | Purpose |
|---|---|---|
| `src/pages/Login.tsx` | `/login` | Email/roll + password login. Google button when `VITE_GOOGLE_AUTH=true`. Dev role switcher when `VITE_DEV_AUTH=true` or Vite dev. Handles `?error=session_superseded` etc. |

Shared layout/components: `src/components/auth/` (`AuthShell`, `AuthCard`, `AuthAlert`).

## Project Structure

```
imms-frontend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.tsx
â”‚   â”œâ”€â”€ index.css                    # Design tokens (Academic Core palette + typography)
â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”œâ”€â”€ client.ts                # withCredentials, 401 â†’ /auth/refresh
â”‚   â”‚   â”œâ”€â”€ allowedUsers.ts
â”‚   â”‚   â”œâ”€â”€ faculty.ts, students.ts
â”‚   â”‚   â”œâ”€â”€ import.ts
â”‚   â”‚   â”œâ”€â”€ subjects.ts
â”‚   â”‚   â”œâ”€â”€ subject-assignment-roster.ts  # Per-teacher roster (mirrors elective enrollment API)
â”‚   â”‚   â””â”€â”€ marks.ts
â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”œâ”€â”€ useAccountInvites.ts   # List + create/delete mutations
â”‚   â”‚   â”œâ”€â”€ useStudents.ts, useFaculty.ts, useSubjects.ts, useAssignments.ts
â”‚   â”‚   â”œâ”€â”€ useAssignmentRoster.ts # Per-teacher roster query + bulk/import/remove mutations
â”‚   â”‚   â””â”€â”€ usePageTitle.ts
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ identifier-patterns.ts # Roll validation; deriveBatch/deriveDepartment from roll
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ AuthBootstrap.tsx
â”‚   â”‚   â”œâ”€â”€ auth/                    # Login shared UI
â”‚   â”‚   â”œâ”€â”€ coordinator/
â”‚   â”‚   â”‚   â”œâ”€â”€ account-invites/     # BulkInviteForm, SingleInviteForm, InviteTable, RosterDialog
â”‚   â”‚   â”‚   â””â”€â”€ subjects/            # AddSubjectForm, AddAssessmentForm, ElectiveRosterModal, BacklogStudentForm
â”‚   â”‚   â”œâ”€â”€ staff/                   # StaffShell, StaffTabBar (coordinator/teacher)
â”‚   â”‚   â”œâ”€â”€ student/                 # Student portal shell, SubjectCard, etc.
â”‚   â”‚   â””â”€â”€ shared/                  # SubmissionStatusBadge, ExcelImportCard
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ Login.tsx
â”‚   â”‚   â”œâ”€â”€ coordinator/
â”‚   â”‚   â”‚   â”œâ”€â”€ Dashboard.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AccountInvites.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ StudentsManagement.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ FacultyManagement.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ SubjectsManagement.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ AssignmentsManagement.tsx
â”‚   â”‚   â”‚   â””â”€â”€ MarksEntry.tsx               # Exam â†’ Subject â†’ Semester â†’ Excel upload
â”‚   â”‚   â”œâ”€â”€ teacher/Dashboard.tsx
â”‚   â”‚   â”œâ”€â”€ student/
â”‚   â”‚   â”‚   â”œâ”€â”€ Marksheet.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Schedule.tsx         # Placeholder (no API yet)
â”‚   â”‚   â”‚   â””â”€â”€ Profile.tsx
â”‚   â”‚   â””â”€â”€ shared/MarksGridPage.tsx
â”‚   â”œâ”€â”€ routes/PrivateRoute.tsx, RoleRoute.tsx
â”‚   â””â”€â”€ stores/authStore.ts
â””â”€â”€ context.md
```

## Routes

| Path | Role | Purpose |
|---|---|---|
| `/login` | Public | Password login (+ optional Google / dev switcher) |
| `/coordinator` | Coordinator | Tabs: Subject, Exam & Assignments, **Marks Entry**, Manage Faculty, Manage Student, Account Management |
| `/coordinator/marks/:assignmentId/:assessmentId` | Coordinator | NE flags, lock, unlock, publish, unpublish |
| `/teacher` | Teacher | Assigned subjects â†’ marks entry links |
| `/teacher/marks/:assignmentId/:assessmentId` | Teacher | Enter marks, AB, submit |
| `/student` | Student | Marksheet (default tab) |
| `/student/schedule` | Student | Schedule placeholder |
| `/student/profile` | Student | Account info + logout |

## UI Surfaces by Role

| Role | Shell | Notes |
|---|---|---|
| Student | `StudentShell` | Sidebar flush-left on desktop (matches staff layout); mobile bottom nav |
| Coordinator / Teacher | `StaffShell` | Left-aligned fixed sidebar (desktop) / slide-in drawer (mobile) with `StaffSidebar`. User info + Logout pinned to bottom |
| Marks grid | `StaffShell` (wide) | Shared by coordinator and teacher at `/â€¦/marks/:assignmentId/:assessmentId` |

## Implemented Features

- [x] Epic 1.1 â€” Project Scaffolding
- [x] Epic 1.3 — Authentication (Google OAuth + cookie session + single concurrent session)
- [x] Epic 1.4 â€” Allowed User Management UI
- [x] Epic 1.5 â€” Excel Import UI
- [x] Epic 2.1 â€” Subject & Assessment management UI (full CRUD, search/filter)
- [x] Epic 2.2 â€” Subject Assignment UI (semester auto-fill, academic year, search/filter, status badges)
- [x] Epic 2.3 â€” Marks grid UI (NE / AB / save draft, search, summary, status badge, read-only banners, coordinator Excel marks import tab)
- [x] Epic 2.4 â€” Submit / lock / unlock / publish / unpublish with confirm dialogs + API error feedback
- [x] Student portal UI â€” marksheet cards, profile, auth pages (Academic Core design)

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API (`http://localhost:3000/api/v1`) |

## Local Development

Both servers must run:

```powershell
# Terminal 1 â€” backend (from imms-backend, NOT frontend)
cd imms-backend
npm run start:dev

# Terminal 2 â€” frontend
cd imms-frontend
npm run dev
```

Open http://localhost:5173 — sign in with test credentials (see Dev sign-in below) or dev role switcher.

Copy `.env.example` â†’ `.env` and set `VITE_API_BASE_URL=http://localhost:3000/api/v1`.

Database seed runs in **backend only**: `cd imms-backend && npx prisma db seed`

## Marks Grid UX (Epic 2.3/2.4 enhancements)

`MarksGridPage.tsx`:
- `SubmissionStatusBadge` for workflow status
- Read-only banner when SUBMITTED/PUBLISHED ("View only" teacher / "Marks are locked" coordinator)
- NE rows highlighted amber for teachers; NE label shown in name column
- Client-side search by roll number / name
- Footer summary: entered Â· AB Â· NE Â· blank counts
- Confirm dialogs on submit, unlock, publish, unpublish
- Coordinator: **Lock Marks**, **Unlock for Teacher**, **Publish Results**, **Unpublish Results**, **Save Marks** (enables editing student marks and AB checkboxes in DRAFT mode)
- Export features (coordinator only): **Download PDF** (using `jspdf` & `jspdf-autotable`) and **Download Excel** (using `exceljs` as native warning-free `.xlsx` file). NE student marks are masked in exports as a light-blue highlighted "NE" cell.
- PUBLISHED coordinator view: unpublish available; info banner for students
- All workflow actions show backend error messages via `apiErrorMessage`
- Marksheet uses `hasPublished` from API (not only `/auth/me` studentState)
- Tab order: NE/AB checkboxes are skipped when tabbing between mark inputs (`MarksGridRow.tsx`, `tabIndex={-1}` on flag controls)

## Coordinator: Exam & Assignments

Subjects tab is catalog-only. **CIE exams, teacher assignment, backlog students, and per-assignment roster** live on **Exam & Assignments** (`AssignmentsManagement.tsx`).

| Action | UI | API |
|---|---|---|
| Open Marks | Primary filled button in expanded CIE row | `/coordinator/marks/:assignmentId/:assessmentId` |
| Backlog students | Purple outlined button | `POST/DELETE /subjects/:id/enrollments/*` (single roll via `BacklogStudentForm`) |
| Manage roster | Neutral outlined button per teacher | `GET/POST /subject-assignments/:id/roster/*` via `ElectiveRosterModal` |
| Delete assignment | Red outlined button per teacher | `DELETE /subject-assignments/:id` |

Removing a backlog student clears both `SubjectEnrollment` and any `SubjectAssignmentRoster` row on that offering (backend sync). Removing the last roster row for a student also drops the offering enrollment.

## Coordinator: Marks Entry

**Marks Entry** tab (`MarksEntry.tsx`) — when teachers have not entered marks on the website, coordinator uploads Excel directly (bypasses teachers). Cascade fetches **one step at a time** (no cache): year → subjects → semesters → exams via `GET /subject-offerings/marks-entry/*`.

| Step | UI | API |
|---|---|---|
| 1. Year | Academic year dropdown (client list) | — |
| 2. Subject | Subject dropdown | `GET /subject-offerings/marks-entry/subjects?academicYear=` |
| 3. Semester | Semester dropdown | `GET /subject-offerings/marks-entry/semesters?academicYear=&subjectId=` |
| 4. Exam | CIE round dropdown | `GET /subject-offerings/marks-entry/exams?academicYear=&subjectId=&semester=` |
| 5. Excel | Template download + upload | `GET /marks/import/template`, `POST /marks/import` |

Columns: **Student ID**, **Marks** (number or `AB`). NE flags remain in Exam & Assignments. Sidebar order: Subject → Exam & Assignments → **Marks Entry** → Manage Faculty → Manage Student → Account Management.

## Coordinator: Account Management

Create student/teacher/coordinator accounts, bulk paste IDs, filter by role. Bulk creation button **Create accounts & download Excel** downloads a native `.xlsx` sheet with IDs and emails (no activation links). **`hasSignedIn`** column shows whether the user has completed at least one Google sign-in.

**Add to roster** (student accounts not yet in master roster): department and batch **auto-derive from roll number** (`deriveDepartmentFromRollNumber`, `deriveBatchFromRollNumber`); semester must be entered manually.

**Student Excel:** CSPIT `Roll No` + `Student Name` (regular `24ITâ€¦` and diploma `D25ITâ€¦`). Set semester in import panel; department/batch auto from roll when omitted.

**Faculty Excel:** CSPIT name list (single column) matched to accounts by name, or structured sheet with email slug + name.

**Teacher accounts:** institutional email `firstnamelastname.dept@charusat.ac.in` (e.g. `nishatshaikh.it@charusat.ac.in`) â€” not 3-letter codes. Bulk paste one email per line.

## Subjects: Core vs Elective

- **Core** â€” students in same department + semester + **current academic year** appear on marks grid automatically; **backlog** students (advanced past the offering semester) via offering enrollment or per-teacher roster import
- **Elective** â€” coordinator imports roll numbers **for a specific offering** (academic year + semester) after create; teacher sees only enrolled students

**Per-assignment roster:** explicit roll list on one teacher's assignment (`Manage roster` on Exam & Assignments). When roster rows exist, marks grid uses that list; adding students also creates `SubjectEnrollment` for backlog/marksheet override.

Subjects tab: catalog only. **CIE exams, teacher assignment, backlog students, and per-assignment roster** live in **Exam & Assignments**.

## Data model â€” Subject Offering + CIE Round

| Layer | Change |
|---|---|
| Subject | Catalog only â€” no nested assessments |
| SubjectOffering | `subjectId + academicYear + semester` |
| CIERound | Dept-scoped round name + auto sequence |
| Assessment | `subjectOfferingId + cieRoundId` (+ maxMarks, dates) |
| SubjectAssignment | Points at offering (semester/year from offering) |
| Student | `currentAcademicYear` set on create/import from batch + sem |

API highlights:
- `POST /subjects/:id/assessments` body: `{ academicYear, semester, cieRoundName, maxMarks, ... }`
- `GET /cie-rounds?academicYear=&semester=&department=`
- `GET /marks/my-marksheet` â†’ `{ cieRounds: [{ name, sequence, subjects: [...] }], ... }`
- Elective enrollments require `academicYear` + `semester` query/body params
- Backlog enrollment (CORE): same enrollment endpoints; student must have advanced past the offering's semester
- Assignment roster: `GET/POST /subject-assignments/:id/roster/*` (bulk, import, template, delete)

## Dev sign-in (after seed)

| Role | Login | Password |
|------|-------|----------|
| Coordinator | coordinator@charusat.ac.in | password123 |
| Teacher | test.it@charusat.ac.in | password123@ |
| Student | 24IT093 or 24it093@charusat.edu.in | password123@ |

**Google OAuth (later):** backend `GOOGLE_*` env + frontend `VITE_GOOGLE_AUTH=true`.

**Single session:** signing in elsewhere redirects old browser to `/login?error=session_superseded` (cookies cleared, no reload loop).

## Last Updated

**Auth + session UX** (2026-08-11):
- Password login restored for 3 seeded test accounts; Google optional via `VITE_GOOGLE_AUTH`.
- Superseded-session fix: skip `/auth/me` on `/login`, single redirect via `session-expired.ts`.
- `StudentShell`: sidebar pinned to viewport left edge (no empty margin on wide screens).

**Exam & Assignments action buttons + marks grid tab order** (2026-08-11):
- `AssignmentsManagement.tsx`: **Open Marks**, **Backlog students**, **Manage roster**, and **Delete** use filled/outlined button styles (aligned with teacher dashboard CIE exam links) instead of plain text links.
- `MarksGridRow.tsx`: NE/AB checkboxes use `tabIndex={-1}` so keyboard Tab moves mark input → mark input only (skips flag toggles).

**Backlog students + per-teacher Excel roster** (2026-08-11):
- New `BacklogStudentForm.tsx` (single roll-number add/remove, no Excel) opened per subject-offering row in Exam & Assignments ("Backlog students" action) â€” reuses the existing `bulkEnrollStudents`/`removeSubjectEnrollment` API + `useSubjectMutations` hooks with a 1-element roll-number array.
- `ElectiveRosterModal.tsx` generalized (title/description/`onDownloadTemplate`/`onImport` now props instead of hardcoded elective-enrollment calls) so it's reused unmodified for the new per-assignment "Manage roster" Excel/paste flow, not just electives.
- New `api/subject-assignment-roster.ts` + `hooks/useAssignmentRoster.ts` mirror the enrollment API/hooks 1:1, pointed at `/subject-assignments/:id/roster/*`.
- `AssignmentsManagement.tsx`: "Manage roster" action per teacher assignment opens the roster modal; `formatRange` shows "Custom roster (N students)" when `assignment.rosterCount > 0`.
- `api/subjects.ts`: `SubjectAssignment`/`SubjectOfferingRow` types gained `rosterCount?: number`.

**Subject Offering + CIE Round refactor** (2026-08-10):
- Schema: SubjectOffering, CIERound; Assessment/Assignment/Enrollment scoped to offerings; Student.currentAcademicYear.
- Security: marksheet + assignment visibility filtered by student.currentAcademicYear; assessment-offering match on mark entry.
- Coordinator: Add CIE Exam uses CIE round combobox (datalist from GET /cie-rounds); elective roster scoped by academic year.
- Student marksheet: CIE-first layout via `CIECard` (round â†’ subjects table).
- Docs: `03_ARCHITECTURE.md` Â§6 data model; this file data-model + API table.

**Coordinator workflow & UI polish** (2026-08-10):
- Login/activate brand changed to **IMMS Portal** (public auth header only; in-app role headers unchanged).
- **Student shell rebuilt for staff-shell parity**: 260px sidebar, graduation-cap branding, left-border active tabs, bottom-pinned user + Logout; mobile bottom nav retained (intentional student pattern).
- **Marks grid**: Save Changes disabled until there are edits and when locked (new minimal dirty tracking); NE/AB controls merged into one "Enter Marks" cell next to the input; filter tabs now `All / NE / AB` (was "Not NE"); inline over-`maxMarks` feedback (red border + "Max N") while typing â€” backend remains authoritative.
- **Locked-teacher audit**: lock == `SUBMITTED` (no separate LOCKED status); editing already gated by `isDraft`; verified fully non-editable when locked.
- **Coordinator sidebar reorder**: Subject â†’ Exam & Assignments â†’ Manage Faculty â†’ Manage Student â†’ Account Management (**Marks Entry tab deferred** by owner).
- **Add Assessment moved** from Subject tab to Exam & Assignments (button-gated, same logic; assignments bundle invalidated on success so the new exam's "Open Marks" link appears immediately). **Assign Teacher to Subject** is now a toggle button that opens the form.
- Removed deprecated unused `TEACHER_CODE_PATTERN` + `normalizeTeacherCodeInput` (frontend-only).

**Security & roster defaults** (2026-08-07):
- Activation links use URL hash (`/activate#token=â€¦`); token posted in body, stripped from address bar.
- Login post-activation message uses router state (`auth-flash.ts`), not `?activated=1`.
- Roster dialog auto-fills department + batch from roll number; semester entered manually (no hardcoded defaults).
- Diploma batch format: `2025-2028` (3-year); B.Tech: `2024-2028` (4-year).

**Handoff Phase 2 â€” React Query & component split** (2026-08-07):
- Coordinator dashboard uses React Query hooks for all tab data + mutations (`useAccountInvites`, `useStudents`, `useFaculty`, `useSubjects`, `useSubjectMutations`).
- Split `AccountInvites.tsx` â†’ `account-invites/*` components; `SubjectsManagement.tsx` â†’ `subjects/*` components.

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

**Docs sync â€” backend security hardening** (2026-08-05): API spec updated for change-password (`currentPassword`), password reset endpoints, `GET /health`, and `GET /audit`. No frontend UI yet for reset or audit viewer.

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
