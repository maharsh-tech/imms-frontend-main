# IMMS Frontend — Project Context

> Living document. Updated after each epic completes.

## Quick Reference

| Property | Value |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Client State | Zustand (user profile only — **no tokens in storage**) |
| HTTP Client | Axios with `withCredentials: true` (httpOnly cookies) |
| Routing | React Router v7 |
| Auth | Plan A: activation link → login |
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

## Project Structure

```
imms-frontend/
├── src/
│   ├── App.tsx
│   ├── api/
│   │   ├── client.ts              # withCredentials, 401 → /auth/refresh
│   │   ├── allowedUsers.ts
│   │   ├── import.ts
│   │   ├── subjects.ts
│   │   └── marks.ts
│   ├── components/
│   │   ├── AuthBootstrap.tsx
│   │   └── shared/ExcelImportCard.tsx, SubmissionStatusBadge.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ActivateAccount.tsx
│   │   ├── coordinator/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AllowedUsers.tsx
│   │   │   ├── SubjectsManagement.tsx
│   │   │   └── AssignmentsManagement.tsx
│   │   ├── teacher/Dashboard.tsx
│   │   ├── student/Marksheet.tsx
│   │   └── shared/MarksGridPage.tsx
│   ├── routes/PrivateRoute.tsx, RoleRoute.tsx
│   └── stores/authStore.ts
└── context.md
```

## Routes

| Path | Role | Purpose |
|---|---|---|
| `/login` | Public | Email/password login |
| `/activate` | Public | Set password from activation link |
| `/coordinator` | Coordinator | Tabs: account invites, import, subjects, assignments |
| `/coordinator/marks/:assignmentId/:assessmentId` | Coordinator | NE flags, unlock, publish |
| `/teacher` | Teacher | Assigned subjects → marks entry links |
| `/teacher/marks/:assignmentId/:assessmentId` | Teacher | Enter marks, AB, submit |
| `/student` | Student | Published marksheet (or state message) |

## Implemented Features

- [x] Epic 1.1 — Project Scaffolding
- [x] Epic 1.3 — Authentication (Plan A + cookie session)
- [x] Epic 1.4 — Allowed User Management UI
- [x] Epic 1.5 — Excel Import UI
- [x] Epic 2.1 — Subject & Assessment management UI (full CRUD, search/filter)
- [x] Epic 2.2 — Subject Assignment UI (semester auto-fill, academic year, search/filter, status badges)
- [x] Epic 2.3 — Marks grid UI (NE / AB / save draft, search, summary, status badge, read-only banners)
- [x] Epic 2.4 — Submit / unlock / publish with confirm dialogs + API error feedback

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
- Confirm dialogs on submit, unlock, publish
- PUBLISHED coordinator view: info message only, no action buttons
- All workflow actions show backend error messages via `apiErrorMessage`

## Coordinator: Account Invites

Replaces the old Allowed Users tab. Bulk paste `23IT001, email@charusat.edu.in` to create accounts, filter by role, copy activation links (sorted by ID). Excel import only works after the account exists.

## Last Updated

**Account Invites UI + import requires pre-created account** (2026-07-30)
