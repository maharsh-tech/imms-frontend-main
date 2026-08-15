# API Specification
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Base URL:** https://api.imms.yourdomain.com/api/v1  
**Authentication:** httpOnly cookie session (`imms_access_token`, `imms_refresh_token`). Send requests with `credentials: include`. No Bearer token in client JS.

---

## 1. Authentication

Primary: **Google OAuth** for students and teachers. **Password login** (`POST /auth/login`) is **COORDINATOR-only**. Accounts are provisioned in Account Management (allowlist). No activation or reset flows.

### 1.1 Password Login (coordinator only)
```
POST /auth/login
```
**Body:**
```json
{ "loginId": "coordinator@charusat.ac.in", "password": "password123" }
```

Teachers and students receive the same generic **401** `{ "message": "Invalid credentials" }` even if a `passwordHash` were present.

**Response 200:** Sets httpOnly cookies. Body:
```json
{
  "user": {
    "id": "cuid123",
    "email": "coordinator@charusat.ac.in",
    "name": "Test Coordinator",
    "role": "COORDINATOR",
    "lastLoginAt": "2026-08-11T09:00:00.000Z"
  }
}
```

**Response 401:** `{ "message": "Invalid credentials" }` — missing/wrong password, or the account is not COORDINATOR.

Uses `establishSession` (bumps `tokenVersion`, single concurrent session).

### 1.2 Google Sign-In
```
GET /auth/google
```
Redirects browser to Google OAuth consent. Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` on the server.

### 1.3 Google Callback
```
GET /auth/google/callback
```
Google redirects here after consent. On success: sets httpOnly cookies and redirects to frontend role dashboard (`/teacher` or `/student`; coordinator typically uses password login).

On failure redirects to `{FRONTEND_URL}/login?error=` with one of: `not_whitelisted`, `domain_mismatch`, `inactive`, `google_no_email`, `auth_failed`.

**Rules:**
- Google email must match an existing `User` row (created when coordinator adds the account)
- Domain must match role (`@charusat.edu.in` students, `@charusat.ac.in` staff)
- Profile `name` is cleaned from Google `displayName` (leading roll matching the email local-part is stripped). `profilePic` is **not** saved
- Roll/id is derived from the email local-part, never from Google name
- New sign-in bumps `tokenVersion` — only one active session per user

### 1.4 Dev Role Switcher (local only)
```
GET /auth/dev/login?role=COORDINATOR|TEACHER|STUDENT
```
Blocked unless `NODE_ENV !== production` and `DEV_AUTH_ENABLED=true`. Issues session for seeded dev user by role. **Never enable in production.**

---

### 1.5 Refresh Session
```
POST /auth/refresh
```
Uses `imms_refresh_token` cookie. Refreshes `imms_access_token` cookie.

**Response 200:** `{ "message": "Session refreshed" }`

**Response 401 (superseded session):** `{ "message": "Signed in on another device — please sign in again" }`

---

### 1.6 Logout
```
POST /auth/logout
```
No access token required. Revokes session via `imms_refresh_token` cookie (`tokenVersion` bump when valid), then clears auth cookies.

**Response 200:** `{ "message": "Logged out successfully" }`

---

### 1.7 Get Current User
```
GET /auth/me
```
Requires valid access cookie.

**Response 200:**
```json
{
  "user": {
    "id": "cuid123",
    "email": "dev.it@charusat.ac.in",
    "name": "John Doe",
    "role": "TEACHER",
    "lastLoginAt": "2026-08-11T09:00:00.000Z"
  },
  "studentState": null
}
```

For role STUDENT, `studentState` is one of:
- `"NO_RECORD"` — no student record linked to user account
- `"UNPUBLISHED"` — student record exists but no visible published results
- `"PUBLISHED"` — at least one published assessment visible to this student

Visibility matches `GET /marks/my-marksheet`: offerings in the student's current academic year + semester (core dept match, enrolled electives, or marks within that scoped branch). The enrollment OR-branch is also limited to that same year + semester, so past-semester backlog offerings do not appear on the student marksheet (coordinator reports keep explicit year/sem scope). Only **published** submissions appear; response is display-only (`code`, `name`, `maxMarks`, `display` — no mark row IDs or raw `marksObtained`). No `studentId` query. Student roster is auto-linked on Google sign-in and `GET /auth/me` by email or `allowedUser.identifier` → roll number.

For non-student roles, `studentState` is `null`.

---

### 1.8 Health Check
```
GET /health
```
No auth required. Used by load balancers / uptime monitors.

**Response 200:**
```json
{
  "status": "healthy",
  "db": "ok",
  "uptimeMs": 123456,
  "checkedAt": "2026-08-05T12:00:00.000Z",
  "latencyMs": 3
}
```

---

## 2. Allowed Users (Coordinator Only)

### 2.1 Add Allowed User
```
POST /allowed-users
Roles: COORDINATOR
```
**Body (student — identifier auto-generates email):**
```json
{ "role": "STUDENT", "identifier": "24IT093" }
```

**Body (teacher — full institutional email):**
```json
{ "role": "TEACHER", "email": "nishatshaikh.it@charusat.ac.in" }
```

**Body (coordinator):** rejected. Coordinators are seed-only — do not provision via this endpoint (`400`).

Domain rules: `STUDENT` → `@charusat.edu.in`; `TEACHER`/`COORDINATOR` → `@charusat.ac.in`.

**Response 201:**
```json
{
  "id": "cuid123",
  "email": "24it093@charusat.edu.in",
  "role": "STUDENT",
  "identifier": "24IT093",
  "hasSignedIn": false,
  "rosterLinked": false
}
```

Account is ready immediately — user signs in with Google using their institutional email.

---

### 2.2 List Allowed Users
```
GET /allowed-users?page=1&limit=50
Roles: COORDINATOR
```
**Response 200:** Paginated account rows.

```json
{
  "data": [
    {
      "id": "cuid123",
      "email": "24it093@charusat.edu.in",
      "role": "STUDENT",
      "identifier": "24IT093",
      "hasSignedIn": false,
      "rosterLinked": false
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

`hasSignedIn` is `true` when `User.lastLoginAt` is set. It is **display-only** — assign teacher, Open Marks, and grid writes must not require it.

---

### 2.3 Remove Allowed User
```
DELETE /allowed-users/:id
Roles: COORDINATOR
```
**Response 200:** `{ "success": true }`

---

## 3. Students

### 3.1 Import Students (Excel)
`
POST /students/import
Roles: COORDINATOR
Content-Type: multipart/form-data
`
**Body:** Form field `file` (.xlsx file)

**Query params (required unless noted):**
- `department` — optional fallback for blank Department cells; blank cells default to `IT`
- `semester` — optional fallback for blank Semester cells; the sheet's `Semester` column is the source of truth

**Template columns (exactly 6, in order):** `Roll No`, `Student Name`, `Student Email`, `Department`, `Semester`, `Academic Year`.
- `Department` blank → defaults to `IT`.
- `Semester` comes from the sheet (1–12); a blank cell is rejected with a row error unless the optional `semester` query param is provided.
- `Academic Year` is **required per row** and written verbatim to `Student.currentAcademicYear` (format `YYYY-YYYY`); blank/malformed cells are rejected with a row error.
- `Student Email` is accepted but ignored — the student email is auto-generated from the roll number.
- `Batch` is **not** an input column; it is always derived from the roll (`24IT` → `2024-2028`, `D25IT` → `2025-2028`).
- Re-import is an upsert: an existing roll updates the same row in place (semester + currentAcademicYear overwritten) — no new row, no new version. Supports regular and diploma rolls.

**Response 200:**
`json
{
  "imported": 245,
  "skipped": 3,
  "errors": [
    { "row": 5, "reason": "Duplicate roll number: 2023CS005" }
  ]
}
`

---

### 3.2 List Students
`
GET /students?semester=3&department=CS&page=1&limit=50
Roles: COORDINATOR
`
**Response 200:**
`json
{
  "data": [
    {
      "id": "cuid123",
      "rollNumber": "2023CS001",
      "name": "Jane Doe",
      "email": "jane@institution.edu",
      "department": "CS",
      "semester": 3,
      "batch": "2024-2028"
    }
  ],
  "total": 245,
  "page": 1,
  "limit": 50
}
`

---

### 3.3 Get Student by ID
`
GET /students/:id
Roles: COORDINATOR
`
**Response 200:** Single student object.

---

### 3.4 Delete Student
`
DELETE /students/:id
Roles: COORDINATOR
`
**Response 200:** { "message": "Student deleted" }  
**Response 409:** { "error": "MARKS_EXIST", "message": "Cannot delete student with existing marks" }

---

## 4. Faculty

### 4.1 Import Faculty (Excel)
`
POST /faculty/import
Roles: COORDINATOR
Content-Type: multipart/form-data
`
Same pattern as student import.

**Query params:**
- `department` — optional fallback for blank Department cells; blank cells default to `IT`

**Template columns (exactly 3, in order):** `Email`, `Full Name`, `Department`.
- `Email` is the teacher login slug (e.g. `nishatshaikh.it`); the faculty email is auto-generated as `{slug}@charusat.ac.in`.
- `Department` blank → defaults to `IT`.
- Legacy files with an `Email slug` header still parse.
- **Formats:** CSPIT single-column name list (matched to Account Management, department defaults to IT), or the structured 3-column sheet above.

---

### 4.2 List Faculty
`
GET /faculty?department=CS&page=1&limit=50
Roles: COORDINATOR
`
**Response 200:** Paginated faculty list.

---

## 5. Subjects

### 5.1 Create Subject
`
POST /subjects
Roles: COORDINATOR
`
**Body:**
```json
{
  "code": "CS301",
  "name": "Data Structures",
  "department": "CS",
  "semester": 3,
  "subjectType": "CORE"
}
```
`subjectType`: `"CORE"` (default) or `"ELECTIVE"`. Elective subjects require coordinator enrollment import before marks grid shows students.

**Response 201:** Created subject object.

---

### 5.2 List Subjects
```
GET /subjects?semester=3&department=CS
Roles: COORDINATOR, TEACHER (filtered by assignment)
```
Teachers receive only their assigned subjects.

---

### 5.3 Update Subject
```
PATCH /subjects/:id
Roles: COORDINATOR
```
**Body:** Partial subject fields.

---

### 5.4 Delete Subject
```
DELETE /subjects/:id
Roles: COORDINATOR
```
**Response 409:** If marks exist for this subject.

---

### 5.5 Subject Enrollments (elective roster + core backlog)

```
GET    /subjects/:id/enrollments?academicYear=2026-2027&semester=5
GET    /subjects/:id/enrollments/template
POST   /subjects/:id/enrollments/bulk     Body: { "academicYear": "2026-2027", "semester": 5, "rollNumbers": ["24IT093", ...] }
POST   /subjects/:id/enrollments/import?academicYear=2026-2027&semester=5   multipart Excel
DELETE /subjects/:id/enrollments/:studentId?academicYear=2026-2027&semester=5
Roles: COORDINATOR
```
Also removes any `SubjectAssignmentRoster` rows for that student on assignments under the same offering (keeps marks grid and backlog enrollment in sync).
Enrollments are scoped to a **subject offering** (`subject + academicYear + semester`), not the catalog subject alone.

- **Elective:** student must exist in master roster with matching department and semester.
- **Core (backlog):** student must be in the same department and have **advanced past** the offering's semester (e.g. sem 7 student retaking a sem 5 core). Creates a `SubjectEnrollment` override so the student appears on the marks grid and marksheet without matching the offering's year/semester cohort.

---

## 6. CIE Rounds

**CIE** = Continuous Internal Evaluation (the internal exam name used at the college).

### 6.1 List CIE Rounds
```
GET /cie-rounds?academicYear=2026-2027&semester=5&department=IT
Roles: COORDINATOR
```
Returns shared internal-exam rounds for a department/term (e.g. CIE 1, CIE 2), sorted by `sequence`. Used by the coordinator UI when adding a CIE exam to a subject.

---

## 7. CIE Exams (API: Assessments, nested under Subjects)

Each assessment row = one subject offering × one CIE round. Display name comes from the linked CIE round, not a free-text field.

### 7.1 Create CIE Exam
```
POST /subjects/:subjectId/assessments
Roles: COORDINATOR
```
**Body:**
```json
{
  "academicYear": "2026-2027",
  "semester": 5,
  "cieRoundName": "CIE 1",
  "maxMarks": 20,
  "examDate": "2026-09-15",
  "examTime": "10:00 AM"
}
```
Creates or reuses `SubjectOffering` and `CIERound`, then the assessment. **Side effect:** Creates `assessment_submissions` rows (DRAFT) for every existing teacher assignment on that offering.

### 7.2 List CIE Exams for Subject
```
GET /subjects/:subjectId/assessments?academicYear=2026-2027&semester=5
Roles: COORDINATOR
```

### 7.3 Update CIE Exam
```
PATCH /subjects/:subjectId/assessments/:assessmentId
Roles: COORDINATOR
```
**Body:** Partial `{ maxMarks, examDate, examTime }` — CIE round name is not editable here (tied to `CIERound`).

### 7.4 Delete CIE Exam
```
DELETE /subjects/:subjectId/assessments/:assessmentId
Roles: COORDINATOR
```
**Response 409:** If marks exist for this CIE exam.

---

## 8. Subject Assignments

### 8.1 Assign Subject to Faculty
```
POST /subject-assignments
Roles: COORDINATOR
```
**Body:**
```json
{
  "subjectId": "cuid_subject",
  "facultyId": "cuid_faculty",
  "semester": 5,
  "academicYear": "2026-2027",
  "startRollNumber": "24IT001",
  "endRollNumber": "24IT065"
}
```
Creates or reuses `SubjectOffering` for `(subjectId, academicYear, semester)`, then the assignment.

---

### 8.2 List Assignments
```
GET /subject-assignments?semester=5&academicYear=2026-2027
Roles: COORDINATOR
```

---

### 8.3 Get My Assignments (Teacher)
```
GET /subject-assignments/my
Roles: TEACHER
```
Returns only assignments for the authenticated teacher.

---

### 8.4 Delete Assignment
```
DELETE /subject-assignments/:id
Roles: COORDINATOR
```
Only allowed before marks entry begins.

---

### 8.5 List Subject Offerings (Exam & Assignments page)
```
GET /subject-offerings?academicYear=2026-2027&semester=5
Roles: COORDINATOR
```
Returns subject offerings that have at least one CIE exam or teacher assignment. Used by the coordinator Exam & Assignments table so CIE exams appear even when no teacher is assigned yet. Each row includes nested `subject.assessments` and `assignments[]` (each assignment includes `rosterCount`). UI actions (Open Marks, Backlog students, Manage roster, Delete) render as button-styled controls in the expanded CIE row and Actions column.

**UI defaults:** On tab open, year = current academic year (Jul–Jun); semester = highest semester available for that year in DB. User can still change either selector.

### 8.5a Exam & Assignments cascade (semesters)

```
GET /subject-offerings/assignments/semesters?academicYear=2026-2027
Roles: COORDINATOR
```
**Response 200:** `[5, 3]` (distinct semester numbers for offerings with exams or assignments in that year)

Years list reuses `GET /subject-offerings/marks-entry/years` (same distinct years source).

### 8.5b Marks Entry cascade (lightweight)

Used by the coordinator **Marks Entry** tab. Fetches **one step at a time** (no React Query cache). Does not load full offerings with nested assignments. **Year dropdown defaults to current academic year** on tab open.

```
GET /subject-offerings/marks-entry/years
Roles: COORDINATOR
```
**Response 200:** `["2026-2027", "2025-2026"]` (distinct years from offerings with exams or assignments)

```
GET /subject-offerings/marks-entry/subjects?academicYear=2026-2027
Roles: COORDINATOR
```
**Response 200:** `[{ "id": "cuid", "code": "ITUE201", "name": "OS" }, ...]`

```
GET /subject-offerings/marks-entry/semesters?academicYear=2026-2027&subjectId={id}
Roles: COORDINATOR
```
**Response 200:** `[5, 3]` (semester numbers)

```
GET /subject-offerings/marks-entry/exams?academicYear=2026-2027&subjectId={id}&semester=5
Roles: COORDINATOR
```
**Response 200:** `["CIE-1", "CIE-2"]`

### 8.6 Per-Assignment Roster (explicit roll list)

```
GET    /subject-assignments/:id/roster
GET    /subject-assignments/:id/roster/template
POST   /subject-assignments/:id/roster/bulk     Body: { "rollNumbers": ["24IT093", ...] }
POST   /subject-assignments/:id/roster/import   multipart Excel
DELETE /subject-assignments/:id/roster/:studentId
Roles: COORDINATOR
```

Explicit roll-number roster for one teacher's assignment — alternative to typed `startRollNumber`/`endRollNumber`. When roster rows exist, the marks grid uses this list instead of cohort/range logic. Adding a student also creates a `SubjectEnrollment` for the offering (backlog override). Removal blocked if marks exist for that student under the assignment. A student cannot appear on two teachers' rosters/ranges for the same offering. Deleting the last roster row for a student on the offering also removes their `SubjectEnrollment`.

---

## 9. Marks

### 9.1 Get Marks Grid
```
GET /marks/grid?subjectAssignmentId={id}&assessmentId={id}
Roles: COORDINATOR, TEACHER (assigned only)
```
Returns assignment, assessment, submission status, and student rows with marks/flags.

---

### 9.2 Bulk Upsert Marks
```
PUT /marks/bulk
Roles: TEACHER (assigned only, DRAFT status)
```
**Body:**
```json
{
  "subjectAssignmentId": "cuid_sa",
  "assessmentId": "cuid_ass1",
  "marks": [
    { "studentId": "cuid1", "marksObtained": 25, "flag": "NONE" },
    { "studentId": "cuid2", "marksObtained": null, "flag": "AB" }
  ]
}
```
**Backend validates:** marks ≤ maxMarks; null if AB; NE flags preserved; rejects if not DRAFT.

---

### 9.2a Download Marks Import Template (Coordinator)
```
GET /marks/import/template?subjectId={id}&academicYear=2025-2026&semester=5&cieRoundName=CIE-1
Roles: COORDINATOR
```
Always a header-only template: `Student ID`, `Marks` — no pre-filled student rows. When scope params are provided they are still validated (unknown exam/subject/semester returns 404/400) so bad downloads fail early.

**Response:** `.xlsx` binary stream.

---

### 9.2b Import Marks from Excel (Coordinator)
```
POST /marks/import?subjectId={id}&academicYear=2025-2026&semester=5&cieRoundName=CIE-1
Roles: COORDINATOR
Content-Type: multipart/form-data — field `file` (.xlsx)
```
Coordinator-only bulk marks upload. **Bypasses teachers** — writes while submission is DRAFT or SUBMITTED (rejects if PUBLISHED). Each roll is routed to the correct teacher assignment under the offering. Excel accepts numeric marks or `AB`; `NE` is rejected (set via Exam & Assignments).

**Response 200:**
```json
{
  "imported": 12,
  "updated": 3,
  "skipped": 2,
  "errors": [{ "row": 5, "reason": "Roll 24IT999 is not in any teacher cohort for this subject" }]
}
```

---

### 9.3 Flag NE Students (Coordinator)
```
PATCH /marks/flag-ne
Roles: COORDINATOR (DRAFT status only)
```
**Body:**
```json
{
  "subjectAssignmentId": "cuid_sa",
  "assessmentId": "cuid_ass1",
  "neStudentIds": ["cuid_stu1", "cuid_stu2"]
}
```

---

### 9.4 Submit Marks
```
POST /marks/submit
Roles: TEACHER
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Sets submission status to `SUBMITTED`. Audit log created.

---

### 9.5 Lock Marks (Coordinator)
```
PATCH /marks/lock
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Locks a DRAFT submission (sets `SUBMITTED`). Teacher cannot edit until unlocked.

---

### 9.6 Unlock Submission
```
PATCH /marks/unlock
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Returns submission to `DRAFT`. Audit log created.

---

### 9.7 Publish Results
```
PATCH /marks/publish
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Sets submission status to `PUBLISHED`. Students can now see results. For electives: requires at least one enrolled student; syncs enrollments for students with marks.

---

### 9.8 Unpublish Results
```
PATCH /marks/unpublish
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Returns `PUBLISHED` → `SUBMITTED`. Results hidden from students.

---

### 9.9 Student Marksheet (CIE-first)
```
GET /marks/my-marksheet
Roles: STUDENT
```
**Response 200:**
```json
{
  "semester": 5,
  "studentName": "Dev Student",
  "rollNumber": "23IT001",
  "hasPublished": true,
  "cieRounds": [
    {
      "name": "CIE-1",
      "sequence": 1,
      "subjects": [
        { "code": "IT301", "name": "Data Structures", "maxMarks": 50, "display": "NE" }
      ]
    }
  ]
}
```
Results are grouped by CIE round (`cieRounds[]`, sorted by `sequence`). `display` is computed server-side: `"NE"`, `"AB"`, numeric string, or `"-"`.

**Visibility rules:** Marks are stored permanently per `SubjectOffering` (year + semester). The student marksheet shows only offerings matching the student's `currentAcademicYear` + `semester` (normal cohort path **and** enrollment override). Past-semester backlog offerings stay in the DB and remain visible on coordinator reports (explicit year/sem). Only assessments with **published** submissions are included. No `?studentId=` query.

**Security:** Students cannot call grid/bulk/import/publish/reports endpoints (403). Teachers can only access their own `subjectAssignmentId` (403 on IDOR). The response exposes display strings only — no internal mark row IDs or numeric `marksObtained`.

---

## 10. Reports (Milestone 3 — Excel v1 implemented)

Coordinator **Marks** tab (read-only viewing/export). Separate from **Marks Entry** (Excel upload). PDF endpoints deferred to §10.8.

### 10.1 Cascade selectors (lightweight)

All routes: **COORDINATOR only** · `@UseGuards(JwtAuthGuard, RolesGuard)`.

```
GET /reports/years
GET /reports/semesters?academicYear=2025-2026
GET /reports/batches?academicYear=2025-2026&semester=5
```

**`GET /reports/batches` response 200:**
```json
[
  { "batch": "2024-2028", "department": "IT", "label": "24IT (2024-2028)" }
]
```

Distinct batch+department groups for students who have **published** marks in offerings for that year+semester. Includes inactive/graduated students (`isActive: false` allowed).

**UI defaults:** Year = current academic year; semester = latest available for that year (same Jul–Jun calendar as Exam & Assignments).

---

### 10.2 Batch student list (paginated — no marks in response)

```
GET /reports/batch/students?academicYear=2025-2026&semester=5&batch=2024-2028&department=IT&page=1&limit=50
Roles: COORDINATOR
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "cuid_student",
      "rollNumber": "24IT093",
      "name": "Jane Doe",
      "batch": "2024-2028",
      "department": "IT",
      "isActive": true
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

Students must have at least one **published** mark in the scoped year+semester. Marks are **not** included — fetch per student via §10.3.

---

### 10.3 Individual student marksheet (coordinator)

```
GET /reports/marksheet/:studentId?academicYear=2025-2026&semester=5
Roles: COORDINATOR
```

**Published submissions only** (same rule as student portal). Scope uses explicit `academicYear` + `semester` query params (not the student's current roster semester) so coordinators can view historical semester marks.

**Response 200:**
```json
{
  "student": {
    "rollNumber": "24IT093",
    "name": "Jane Doe",
    "department": "IT",
    "semester": 5,
    "batch": "2024-2028",
    "isActive": true
  },
  "hasPublished": true,
  "cieRounds": [
    {
      "name": "CIE-1",
      "sequence": 1,
      "subjects": [
        {
          "code": "CS301",
          "name": "Data Structures",
          "maxMarks": 20,
          "display": "18",
          "marksObtained": 18,
          "flag": "NONE"
        }
      ]
    }
  ]
}
```

Coordinator response includes raw `marksObtained` + `flag` (students never get these via `/marks/my-marksheet`).

**Response 404:** Unknown `studentId`.

---

### 10.4 Roll search (lazy)

```
GET /reports/students/search?q=24IT&academicYear=2025-2026&semester=5&limit=10
Roles: COORDINATOR
```

Prefix match on `rollNumber` or `name`. Min 3 characters enforced server-side. Only students with published marks in scope. **No marks** in response — `{ id, rollNumber, name, batch, department }[]`.

---

### 10.5 Excel export (server-side)

```
GET /reports/batch/export?academicYear=2025-2026&semester=5&batch=2024-2028&department=IT
GET /reports/marksheet/:studentId/export?academicYear=2025-2026&semester=5
Roles: COORDINATOR
```

**Response:** Binary `.xlsx` stream. `Content-Disposition: attachment; filename="marks_24IT_2025-2026_sem5.xlsx"`.

- **Batch export:** wide matrix (students × subject+CIE columns). Generated on server — browser never receives full batch as JSON first.
- **Single student:** long format (CIE, code, name, max, marks, flag).

Published marks only. NE stored values included for coordinator (not student display masking).

---

### 10.6 Security (mandatory)

| Threat | Control |
|--------|---------|
| Unauthenticated access | `JwtAuthGuard` on entire `ReportsController` — **401** without valid session cookie |
| Inactive account | `JwtStrategy` + `AuthService` reject `User.isActive === false` — **401** |
| Student fetches another student's marks | All `/reports/*` routes **`@Roles(Role.COORDINATOR)` only** — students get **403**. Students use `GET /marks/my-marksheet` (self, display-only, current-sem visibility rules) |
| Teacher fetches batch/other students | Teachers get **403** on all `/reports/*`. Teachers use `GET /marks/grid` for **own** assignments only (service-level IDOR check) |
| IDOR via `studentId` | v1: only coordinators may call `/reports/marksheet/:studentId`. No student self-access on this path (defer self + PDF to later milestone) |
| Draft/unpublished mark leak | Reports query **`SubmissionStatus.PUBLISHED`** only — DRAFT/SUBMITTED marks never returned |
| Bulk scrape | Paginated list (§10.2); no single endpoint returns all students' marks as JSON. Batch export requires coordinator role + audit-friendly scope params |
| CSRF | httpOnly cookie session; CORS restricted to frontend origin with `credentials: true` |

**Implementation requirements:**
- Controller-level `@Roles(Role.COORDINATOR)` on **every** handler (no class-level role with exceptions).
- Unit tests in `reports.controller.spec.ts`: student and teacher receive **403** on each route; unauthenticated **401**.
- Do **not** reuse `GET /marks/my-marksheet` for coordinator cross-student lookup — separate code path with explicit year/sem scope.

**Existing marks endpoints (verified):**

| Endpoint | Roles | Notes |
|----------|-------|-------|
| `GET /marks/my-marksheet` | STUDENT | Display-only; own record via `resolveStudentForUser` |
| `GET /marks/grid` | COORDINATOR, TEACHER | Teacher IDOR blocked in service |
| `GET /marks/import/template` | COORDINATOR | Header-only template (Student ID, Marks) — coordinator-only |
| `GET /subject-offerings/marks-entry/*` | COORDINATOR | Cascade metadata only, no marks |

---

### 10.7 Frontend (coordinator Marks tab)

New sidebar tab **Marks** (above Account Management). Tab id `marksReports` — distinct from **Marks Entry** (`marks`).

| Mode | Lazy flow |
|------|-----------|
| By batch | Year → Semester → Batch → paginated student table → click row loads §10.3 |
| By student | Year + Semester + roll search (≥3 chars) → §10.3 |
| Export | §10.5 blob download buttons |

React Query: `staleTime: 0`, `gcTime: 0`, `enabled` per cascade step (same pattern as Marks Entry).

---

### 10.8 Deferred (PDF / full Milestone 3)

Not in Excel v1:

```
GET /reports/marksheet/:studentId/pdf?semester=&academicYear=
GET /reports/semester?semester=&department=&academicYear=
GET /reports/semester/pdf?...
GET /reports/subject/:subjectAssignmentId
GET /reports/subject/:subjectAssignmentId/pdf
```

When added, same **COORDINATOR-only** rules apply unless explicitly documented otherwise (student self PDF would require `studentId === self` guard).

---

## 11. Audit Logs

### 11.1 Get Audit Logs
```
GET /audit?subjectId=cuid&studentId=cuid&userId=cuid&from=2026-01-01&to=2026-07-24&page=1&limit=50
Roles: COORDINATOR
```
Filter params (all optional): `subjectId`, `studentId`, `userId`, `from`, `to`, `page` (default 1), `limit` (default 50, max 100).

Returns mark value changes (`INSERT`/`UPDATE`), submission transitions (`SUBMIT`/`UNLOCK`/`PUBLISH`), and roster link events (`LINK`).

**Response 200:**
```json
{
  "data": [
    {
      "id": "cuid_audit",
      "action": "UPDATE",
      "tableName": "marks",
      "recordId": "cuid_mark",
      "markId": "cuid_mark",
      "previousValue": { "marksObtained": 20, "flag": "NONE" },
      "newValue": { "marksObtained": 25, "flag": "NONE" },
      "user": { "name": "John Teacher", "email": "...", "role": "TEACHER" },
      "createdAt": "2026-07-24T10:30:00Z"
    }
  ],
  "total": 120,
  "page": 1
}
```

---

## 12. Error Codes Reference

| HTTP Status | Error Code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | Request body validation failed |
| 400 | MARKS_EXCEED_MAX | Marks value exceeds assessment maximum |
| 400 | INVALID_FILE_FORMAT | Uploaded file is not valid .xlsx |
| 401 | UNAUTHORIZED | Missing or expired JWT |
| 403 | DOMAIN_BLOCKED | Email domain not permitted (not institutional domain) |
| 403 | ACCESS_DENIED | Email domain ok but not in AllowedUsers whitelist |
| 403 | ROLE_FORBIDDEN | User role cannot access this endpoint |
| 403 | MARKS_LOCKED | Submission locked; coordinator unlock required |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | DUPLICATE_ENTRY | Roll number or subject code already exists |
| 409 | MARKS_EXIST | Cannot delete resource with dependent marks |
| 200* | STUDENT_NO_RECORD | Auth success but no Student record linked to this email |
| 200* | STUDENT_UNPUBLISHED | Auth success but results not yet published for student's semester |
| 500 | INTERNAL_ERROR | Unexpected server error |

> *200* codes: These are not errors — they are valid auth responses with a `studentState` field. The frontend renders appropriate UI based on this state.
