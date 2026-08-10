# API Specification
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Base URL:** https://api.imms.yourdomain.com/api/v1  
**Authentication:** httpOnly cookie session (`imms_access_token`, `imms_refresh_token`). Send requests with `credentials: include`. No Bearer token in client JS.

---

## 1. Authentication

### 1.1 Login
```
POST /auth/login
```
**Body:**
```json
{ "loginId": "dev.it@charusat.ac.in", "password": "..." }
```

Students use roll number: `{ "loginId": "24IT093", "password": "..." }`

**Response 200:** Sets httpOnly cookies. Body:
```json
{
  "user": {
    "id": "cuid123",
    "email": "dev.it@charusat.ac.in",
    "name": "John Doe",
    "role": "TEACHER",
    "needsPasswordChange": false
  }
}
```

**Response 403 (not activated):**
```json
{ "statusCode": 403, "message": "Account not activated. Use the activation link from your welcome email." }
```

---

### 1.2 Activate Account (Plan A — from email link)
```
POST /auth/activate
```
**Body:**
```json
{ "token": "<activation-jwt>", "newPassword": "NewPass1234" }
```

Password rules: minimum 10 characters, at least one letter and one digit.

**Response 200:**
```json
{ "message": "Account activated. You can now sign in with your new password." }
```

Activation links are generated when coordinator creates a user (`POST /allowed-users` or bulk) or explicitly via `POST /allowed-users/:id/regenerate-activation-link`:

`{FRONTEND_URL}/activate#token=<jwt>` (7-day expiry, one-time use)

The JWT lives in the **URL hash fragment** so it is not sent to the server, Referer headers, or access logs. The frontend reads `#token=`, strips it from the address bar, and sends the token in the `POST /auth/activate` JSON body. Listing accounts does **not** return links (only `hasActivationToken`).

**Security note:** `isActivated` is a **read-only API field** computed server-side from `needsPasswordChange`. It is never passed in URLs. Login success messaging after activation uses React Router location state — not query parameters like `?activated=1`.

---

### 1.3 Refresh Session
```
POST /auth/refresh
```
Uses `imms_refresh_token` cookie. Refreshes `imms_access_token` cookie.

**Response 200:** `{ "message": "Session refreshed" }`

---

### 1.4 Logout
```
POST /auth/logout
```
No access token required. Revokes session via `imms_refresh_token` cookie (`tokenVersion` bump when valid), then clears auth cookies.

**Response 200:** `{ "message": "Logged out successfully" }`

---

### 1.5 Get Current User
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
    "needsPasswordChange": false
  },
  "studentState": null
}
```

For role STUDENT, `studentState` is one of:
- `"NO_RECORD"` — no student record linked to user account
- `"UNPUBLISHED"` — student record exists but no visible published results
- `"PUBLISHED"` — at least one published assessment visible to this student

Visibility matches `GET /marks/my-marksheet`: core subjects (dept + semester), enrolled electives, and any subject where the student has mark rows. Student roster is auto-linked on login/activation by email or roll number (`allowedUser.identifier`).

For non-student roles, `studentState` is `null`.

---

### 1.6 Change Password (authenticated)
```
POST /auth/change-password
```
**Body:**
```json
{
  "currentPassword": "existing-password",
  "newPassword": "NewPass123"
}
```
Password rules: minimum 10 characters, at least one letter and one digit. On success, all existing refresh sessions are revoked (`tokenVersion` bump).

---

### 1.7 Request Password Reset
```
POST /auth/request-password-reset
```
**Body:** `{ "email": "student@charusat.edu.in" }`

Always returns `{ "message": "If the email exists, a reset link has been sent." }` (no email enumeration). Issues a single-use token (60 min expiry) stored server-side. **Email delivery not implemented** — token is for future mail integration; coordinators can reset accounts via activation flow in dev.

---

### 1.8 Reset Password
```
POST /auth/reset-password
```
**Body:**
```json
{
  "token": "one-time-reset-token",
  "newPassword": "NewPass123"
}
```
Consumes the reset token (single-use). Revokes all existing sessions on success.

---

### 1.9 Health Check
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

**Body (coordinator):**
```json
{ "email": "coordinator@charusat.ac.in", "role": "COORDINATOR" }
```

Domain rules: `STUDENT` → `@charusat.edu.in`; `TEACHER`/`COORDINATOR` → `@charusat.ac.in`.

**Response 201:**
```json
{
  "id": "cuid123",
  "email": "24it093@charusat.edu.in",
  "role": "STUDENT",
  "identifier": "24IT093",
  "isActivated": false,
  "activationLink": "http://localhost:5173/activate#token=...",
  "hasActivationToken": true,
  "rosterLinked": false
}
```

---

### 2.2 List Allowed Users
```
GET /allowed-users?page=1&limit=50
Roles: COORDINATOR
```
**Response 200:** Paginated account rows. Pending users include `hasActivationToken` (whether an unused token exists) but **`activationLink` is always `null`** — links are not rotated on list load.

```json
{
  "data": [
    {
      "id": "cuid123",
      "email": "24it093@charusat.edu.in",
      "role": "STUDENT",
      "identifier": "24IT093",
      "isActivated": false,
      "activationLink": null,
      "hasActivationToken": true,
      "rosterLinked": false
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

---

### 2.3 Regenerate Activation Link
```
POST /allowed-users/:id/regenerate-activation-link
Roles: COORDINATOR
```
Issues a fresh activation link for a pending account. Invalidates any previous unused activation token for that user.

**Response 200:** Same shape as create response, with `activationLink` populated.

---

### 2.3b Regenerate All Pending Activation Links
```
POST /allowed-users/regenerate-all-pending
Roles: COORDINATOR
```
Issues fresh activation links for **all** pending accounts in one transaction. Replaces N per-row regenerate calls.

**Response 200:**
```json
{
  "links": [
    {
      "id": "cuid123",
      "identifier": "24IT093",
      "email": "24it093@charusat.edu.in",
      "activationLink": "https://app.example.com/activate#token=..."
    }
  ]
}
```

---

### 2.4 Remove Allowed User
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
- `department` — e.g. `IT`
- `semester` — e.g. `5`
- `batch` — optional; auto-derives from roll when omitted (`24IT` → `2024-2028`, `D25IT` → `2025-2028`)
- `department` in file — optional; auto-derives from roll prefix when omitted (`24IT093` → `IT`)

**CSPIT columns:** `Roll No`, `Student Name` (ignores `Sr No`). Supports regular and diploma rolls.

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
- `department` — optional, default `IT`

**Formats:** CSPIT single-column name list (matched to Account Management), or structured sheet with email slug + name.

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
Returns subject offerings that have at least one CIE exam or teacher assignment. Used by the coordinator Exam & Assignments table so CIE exams appear even when no teacher is assigned yet. Each row includes nested `subject.assessments` and `assignments[]` (each assignment includes `rosterCount`).

### 8.6 Per-Assignment Roster (explicit roll list)

```
GET    /subject-assignments/:id/roster
GET    /subject-assignments/:id/roster/template
POST   /subject-assignments/:id/roster/bulk     Body: { "rollNumbers": ["24IT093", ...] }
POST   /subject-assignments/:id/roster/import   multipart Excel
DELETE /subject-assignments/:id/roster/:studentId
Roles: COORDINATOR
```

Explicit roll-number roster for one teacher's assignment — alternative to typed `startRollNumber`/`endRollNumber`. When roster rows exist, the marks grid uses this list instead of cohort/range logic. Adding a student also creates a `SubjectEnrollment` for the offering (backlog override). Removal blocked if marks exist for that student under the assignment. A student cannot appear on two teachers' rosters/ranges for the same offering.

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

---

## 10. Reports (Milestone 3 — not yet implemented)

### 10.1 Get Student Marksheet
`
GET /reports/marksheet/:studentId?semester=3&academicYear=2025-2026
Roles: COORDINATOR (any student), STUDENT (self only)
`
**Response 200:**
`json
{
  "student": {
    "rollNumber": "2023CS001",
    "name": "Jane Doe",
    "department": "CS",
    "semester": 3
  },
  "subjects": [
    {
      "code": "CS301",
      "name": "Data Structures",
      "maxMarks": 100,
      "marksObtained": 78,
      "passMarks": 40,
      "flag": "NONE",
      "result": "PASS"
    }
  ],
  "summary": {
    "totalMaxMarks": 500,
    "totalMarksObtained": 390,
    "percentage": 78.00,
    "overallResult": "PASS"
  }
}
`

---

### 10.2 Download Marksheet PDF
`
GET /reports/marksheet/:studentId/pdf?semester=3&academicYear=2025-2026
Roles: COORDINATOR, STUDENT (self only)
`
**Response:** Binary PDF stream with Content-Disposition: attachment; filename="marksheet_2023CS001.pdf"

---

### 10.3 Semester Report
`
GET /reports/semester?semester=3&department=CS&academicYear=2025-2026
Roles: COORDINATOR
`
Returns all students with all subject marks for the semester.

---

### 10.4 Semester Report PDF
`
GET /reports/semester/pdf?semester=3&department=CS&academicYear=2025-2026
Roles: COORDINATOR
`
**Response:** PDF binary stream.

---

### 10.5 Subject-wise Report
`
GET /reports/subject/:subjectAssignmentId
Roles: COORDINATOR
`

---

### 10.6 Subject-wise Report PDF
`
GET /reports/subject/:subjectAssignmentId/pdf
Roles: COORDINATOR
`

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
