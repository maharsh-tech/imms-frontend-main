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
{ "email": "teacher@charusat.ac.in", "password": "..." }
```

**Response 200:** Sets httpOnly cookies. Body:
```json
{
  "user": {
    "id": "cuid123",
    "email": "teacher@charusat.ac.in",
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
{ "token": "<activation-jwt>", "newPassword": "your-new-password" }
```

**Response 200:**
```json
{ "message": "Account activated. You can now sign in with your new password." }
```

Activation links are generated when coordinator creates a user: `{FRONTEND_URL}/activate?token=...` (7-day expiry, one-time use).

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
Clears auth cookies.

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
    "email": "teacher@charusat.ac.in",
    "name": "John Doe",
    "role": "TEACHER",
    "needsPasswordChange": false
  },
  "studentState": null
}
```

For role STUDENT, `studentState` is one of:
- `"NO_RECORD"` — no student record linked to user account
- `"UNPUBLISHED"` — student record exists but no published results yet
- `"PUBLISHED"` — at least one published assessment for student's semester/department

For non-student roles, `studentState` is `null`.

---

### 1.6 Change Password (authenticated)
```
POST /auth/change-password
```
**Body:** `{ "newPassword": "..." }`

---

## 2. Allowed Users (Coordinator Only)

### 2.1 Add Allowed User
```
POST /allowed-users
Roles: COORDINATOR
```
**Body:**
```json
{
  "email": "student@charusat.edu.in",
  "role": "STUDENT"
}
```

Domain rules: `STUDENT` → `@charusat.edu.in`; `TEACHER`/`COORDINATOR` → `@charusat.ac.in`.

**Response 201:**
```json
{
  "id": "cuid123",
  "email": "student@charusat.edu.in",
  "role": "STUDENT",
  "credentials": {
    "email": "student@charusat.edu.in",
    "activationLink": "http://localhost:5173/activate?token=..."
  }
}
```

---

### 2.2 List Allowed Users
`
GET /allowed-users?role=TEACHER&page=1&limit=50
Roles: COORDINATOR
`
**Response 200:**
`json
{
  "data": [
    { "id": "cuid123", "email": "...", "role": "TEACHER", "name": "..." }
  ],
  "total": 45,
  "page": 1,
  "limit": 50
}
`

---

### 2.3 Remove Allowed User
`
DELETE /allowed-users/:id
Roles: COORDINATOR
`
**Response 200:** { "message": "User removed from whitelist" }

---

## 3. Students

### 3.1 Import Students (Excel)
`
POST /students/import
Roles: COORDINATOR
Content-Type: multipart/form-data
`
**Body:** Form field ile (.xlsx file)

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
      "batch": "2023-2027"
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
`json
{
  "code": "CS301",
  "name": "Data Structures",
  "department": "CS",
  "semester": 3,
  "creditHours": 4,
  "passMarks": 40
}
`
**Response 201:** Created subject object.

---

### 5.2 List Subjects
`
GET /subjects?semester=3&department=CS
Roles: COORDINATOR, TEACHER (filtered by assignment)
`
Teachers receive only their assigned subjects.

---

### 5.3 Update Subject
`
PATCH /subjects/:id
Roles: COORDINATOR
`
**Body:** Partial subject fields.

---

### 5.4 Delete Subject
`
DELETE /subjects/:id
Roles: COORDINATOR
`
**Response 409:** If marks exist for this subject.

---

## 6. Subject Assignments

### 6.1 Assign Subject to Faculty
`
POST /subject-assignments
Roles: COORDINATOR
`
**Body:**
`json
{
  "subjectId": "cuid_subject",
  "facultyId": "cuid_faculty",
  "semester": 3,
  "academicYear": "2025-2026"
}
`
**Response 201:** Assignment object.

---

### 6.2 List Assignments
`
GET /subject-assignments?semester=3&academicYear=2025-2026
Roles: COORDINATOR
`

---

### 6.3 Get My Assignments (Teacher)
`
GET /subject-assignments/my
Roles: TEACHER
`
Returns only assignments for the authenticated teacher.

---

### 6.4 Delete Assignment
```
DELETE /subject-assignments/:id
Roles: COORDINATOR
```
Only allowed before marks entry begins.

---

## 7. Assessments (nested under Subjects)

### 7.1 Create Assessment
```
POST /subjects/:subjectId/assessments
Roles: COORDINATOR
```
**Body:**
```json
{ "name": "Internal 1", "maxMarks": 50 }
```

### 7.2 List Assessments for Subject
```
GET /subjects/:subjectId/assessments
Roles: COORDINATOR
```

---

## 8. Marks

### 8.1 Get Marks Grid
```
GET /marks/grid?subjectAssignmentId={id}&assessmentId={id}
Roles: COORDINATOR, TEACHER (assigned only)
```
Returns assignment, assessment, submission status, and student rows with marks/flags.

---

### 8.2 Bulk Upsert Marks
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

### 8.3 Flag NE Students (Coordinator)
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

### 8.4 Submit Marks
```
POST /marks/submit
Roles: TEACHER
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Sets submission status to `SUBMITTED`. Audit log created.

---

### 8.5 Unlock Submission
```
PATCH /marks/unlock
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Returns submission to `DRAFT`. Audit log created.

---

### 8.6 Publish Results
```
PATCH /marks/publish
Roles: COORDINATOR
```
**Body:** `{ "subjectAssignmentId": "...", "assessmentId": "..." }`  
Sets submission status to `PUBLISHED`. Students can now see results.

---

### 8.7 Student Marksheet
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
  "subjects": [
    {
      "code": "IT301",
      "name": "Data Structures",
      "assessments": [
        { "name": "Internal 1", "maxMarks": 50, "display": "NE" }
      ]
    }
  ]
}
```
`display` is computed server-side: `"NE"`, `"AB"`, numeric string, or `"-"`.

---

## 9. Reports (Milestone 3 — not yet implemented)

### 9.1 Get Student Marksheet
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

### 9.2 Download Marksheet PDF
`
GET /reports/marksheet/:studentId/pdf?semester=3&academicYear=2025-2026
Roles: COORDINATOR, STUDENT (self only)
`
**Response:** Binary PDF stream with Content-Disposition: attachment; filename="marksheet_2023CS001.pdf"

---

### 9.3 Semester Report
`
GET /reports/semester?semester=3&department=CS&academicYear=2025-2026
Roles: COORDINATOR
`
Returns all students with all subject marks for the semester.

---

### 9.4 Semester Report PDF
`
GET /reports/semester/pdf?semester=3&department=CS&academicYear=2025-2026
Roles: COORDINATOR
`
**Response:** PDF binary stream.

---

### 9.5 Subject-wise Report
`
GET /reports/subject/:subjectAssignmentId
Roles: COORDINATOR
`

---

### 9.6 Subject-wise Report PDF
`
GET /reports/subject/:subjectAssignmentId/pdf
Roles: COORDINATOR
`

---

## 10. Audit Logs

### 10.1 Get Audit Logs
`
GET /audit?subjectId=cuid&userId=cuid&from=2026-01-01&to=2026-07-24&page=1&limit=50
Roles: COORDINATOR
`
**Response 200:**
`json
{
  "data": [
    {
      "id": "cuid_audit",
      "action": "UPDATE",
      "tableName": "marks",
      "recordId": "cuid_mark",
      "previousValue": { "marksObtained": 20 },
      "newValue": { "marksObtained": 25 },
      "user": { "name": "John Teacher", "role": "TEACHER" },
      "createdAt": "2026-07-24T10:30:00Z"
    }
  ],
  "total": 120,
  "page": 1
}
`

---

## 11. Error Codes Reference

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
