# API Specification
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Base URL:** https://api.imms.yourdomain.com/api/v1  
**Authentication:** Bearer JWT token in Authorization header  
**Content-Type:** pplication/json (unless file upload)

---

## 1. Authentication

### 1.1 Initiate Google OAuth
`
GET /auth/google
`
Redirects user to Google OAuth consent screen.

---

### 1.2 Google OAuth Callback
`
GET /auth/google/callback?code={code}&state={state}
`
Exchanges authorization code for Google profile. Returns JWT tokens.

**Response 200:**
`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "user": {
    "id": "cuid123",
    "email": "teacher@college.ac.in",
    "name": "John Doe",
    "role": "TEACHER",
    "profilePic": "https://lh3.googleusercontent.com/..."
  },
  "studentState": null
}
`

For role STUDENT, `studentState` is one of:
- `"NO_RECORD"` — email not found in Student table (show: contact coordinator)
- `"UNPUBLISHED"` — record exists but results not published yet
- `"PUBLISHED"` — results published, show marksheet

**Response 403 (domain blocked):**
`json
{ "error": "DOMAIN_BLOCKED", "message": "Only institutional email accounts (@college.ac.in) are permitted" }
`

**Response 403 (not whitelisted):**
`json
{ "error": "ACCESS_DENIED", "message": "Your account has not been registered. Contact the Exam Coordinator." }
`

---

### 1.3 Refresh Token
`
POST /auth/refresh
`
**Body:**
`json
{ "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
`

**Response 200:**
`json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
`

---

### 1.4 Logout
`
POST /auth/logout
`
Invalidates refresh token server-side.

**Response 200:** { "message": "Logged out successfully" }

---

### 1.5 Get Current User
`
GET /auth/me
`
**Response 200:**
`json
{
  "id": "cuid123",
  "email": "teacher@institution.edu",
  "name": "John Doe",
  "role": "TEACHER"
}
`

---

## 2. Allowed Users (Coordinator Only)

### 2.1 Add Allowed User
`
POST /allowed-users
Roles: COORDINATOR
`
**Body:**
`json
{
  "email": "student@institution.edu",
  "role": "STUDENT",
  "name": "Jane Doe"
}
`
**Response 201:** { "id": "cuid123", "email": "...", "role": "STUDENT" }

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

### 6.4 Unlock Submission
`
PATCH /subject-assignments/:id/unlock
Roles: COORDINATOR
`
**Response 200:** { "message": "Marks unlocked for editing", "status": "DRAFT" }

---

### 6.5 Publish Results
`
PATCH /subject-assignments/:id/publish
Roles: COORDINATOR
`
Makes results visible to students.
**Response 200:** { "isPublished": true, "publishedAt": "2026-07-24T..." }

---

## 7. Assessments

### 7.1 Create Assessment
`
POST /assessments
Roles: COORDINATOR
`
**Body:**
`json
{
  "subjectId": "cuid_subject",
  "name": "Internal",
  "maxMarks": 30
}
`

---

### 7.2 List Assessments for Subject
`
GET /assessments?subjectId=cuid_subject
Roles: COORDINATOR, TEACHER (assigned subjects only)
`

---

## 8. Marks

### 8.1 Get Marks for Subject Assignment
`
GET /marks?subjectAssignmentId={id}
Roles: COORDINATOR, TEACHER (assigned only)
`
**Response 200:**
`json
{
  "subjectAssignment": {
    "id": "cuid_sa",
    "subject": { "code": "CS301", "name": "Data Structures" },
    "status": "DRAFT"
  },
  "assessments": [
    { "id": "cuid_ass1", "name": "Internal", "maxMarks": 30 },
    { "id": "cuid_ass2", "name": "External", "maxMarks": 70 }
  ],
  "marks": [
    {
      "studentId": "cuid_stu1",
      "rollNumber": "2023CS001",
      "studentName": "Jane Doe",
      "entries": [
        { "assessmentId": "cuid_ass1", "marksObtained": 25, "flag": "NONE" },
        { "assessmentId": "cuid_ass2", "marksObtained": null, "flag": "AB" }
      ]
    }
  ]
}
`

---

### 8.2 Upsert Mark
`
PUT /marks
Roles: TEACHER (assigned subjects only)
`
**Body:**
`json
{
  "studentId": "cuid_stu1",
  "assessmentId": "cuid_ass1",
  "subjectAssignmentId": "cuid_sa",
  "marksObtained": 25,
  "flag": "NONE"
}
`
**Validation:** marksObtained must be null if flag is AB or NE; must be <= maxMarks otherwise.

**Response 200:** Updated mark object.  
**Response 400:** { "error": "MARKS_EXCEED_MAX", "message": "Marks 35 exceed maximum 30" }  
**Response 403:** { "error": "MARKS_LOCKED", "message": "Submission is locked. Contact coordinator." }

---

### 8.3 Bulk Upsert Marks (Batch Save)
`
PUT /marks/bulk
Roles: TEACHER
`
**Body:**
`json
{
  "subjectAssignmentId": "cuid_sa",
  "marks": [
    { "studentId": "cuid1", "assessmentId": "cuid_ass1", "marksObtained": 25, "flag": "NONE" },
    { "studentId": "cuid2", "assessmentId": "cuid_ass1", "marksObtained": null, "flag": "AB" }
  ]
}
`
Atomic — all succeed or all fail.

---

### 8.4 Flag NE Student (Coordinator)
`
PATCH /marks/flag-ne
Roles: COORDINATOR
`
**Body:**
`json
{
  "studentId": "cuid_stu",
  "subjectAssignmentId": "cuid_sa"
}
`

---

### 8.5 Submit Marks
`
POST /marks/submit/:subjectAssignmentId
Roles: TEACHER
`
Locks all marks for the subject assignment. Sets status to SUBMITTED.

**Response 200:** { "message": "Marks submitted successfully", "status": "SUBMITTED" }

---

## 9. Reports

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
