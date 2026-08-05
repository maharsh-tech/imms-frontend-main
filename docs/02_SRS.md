# Software Requirements Specification (SRS)
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Document Type:** Software Requirements Specification  

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete functional and non-functional requirements for IMMS. It serves as the contract between stakeholders and the development team.

### 1.2 Scope
IMMSis a web-based internal marks management system built exclusively for the department. It supports the full lifecycle from data import to PDF report generation. Access is restricted to users with institutional email addresses only.

### 1.3 Definitions
| Term | Definition |
|---|---|
| AB | Absent — student was not present for the examination |
| NE | Not Eligible — student is ineligible to sit for examination |
| Marksheet | Document showing a student's marks across all subjects in a semester |
| Submission | The act of a teacher locking and finalizing marks for a subject |
| Max Marks | Maximum allowable marks for a given assessment, defined by the Coordinator |
| Allowed Domain | The institutional email domain (e.g. @college.ac.in) configured in the system. Only accounts from this domain can log in. |
| Unlinked Student | A student who has logged in but has no corresponding record in the Student table yet (data not imported by Coordinator) |

### 1.4 References
- Original SRS Email from Exam Committee (2026-07-24)
- PRD Document: 01_PRD.md

---

## 2. System Overview

IMMS operates in three phases per semester:

1. **Setup Phase** (Coordinator): Import students/faculty, configure subjects, assign teachers
2. **Entry Phase** (Teacher): Enter marks, flag AB students, submit for each subject
3. **Publication Phase** (Coordinator): Review, unlock if needed, generate and publish reports

---

## 3. Functional Requirements

### 3.1 Authentication Module

**FR-AUTH-01:** The system shall use **email/password authentication** with **Plan A onboarding**: coordinator registers users, student receives an **activation link**, sets password once, then signs in normally.

> **Code status:** Google OAuth is **not implemented**. Auth is email/password + JWT only (`POST /auth/login`, `POST /auth/activate`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`).

**FR-AUTH-02 (Domain Restriction):** Email domain is enforced by role on the backend:
- `COORDINATOR` and `TEACHER` → `@charusat.ac.in` only
- `STUDENT` → `@charusat.edu.in` only

**FR-AUTH-03:** Role is assigned when the coordinator adds the user to the AllowedUser whitelist (`POST /allowed-users`).

**FR-AUTH-04:** Login is blocked until the user completes activation (`needsPasswordChange === false`). Unactivated accounts receive 403: *"Account not activated. Use the activation link from your welcome email."*

**FR-AUTH-05:** JWT access token (15 min) and refresh token (7 days) are stored in **httpOnly, SameSite=Strict cookies** — never returned in JSON or client storage.

**FR-AUTH-06:** Role-based access control on every API endpoint and UI route (backend is authoritative).

**FR-AUTH-07:** Logout clears auth cookies via `POST /auth/logout`.

**FR-AUTH-08 (Student Identity Matching):** After a student successfully authenticates, the backend shall look up a Student record by the authenticated email:
- **Record found, results published:** Show the student's full marksheet.
- **Record found, results NOT published:** Show: *"Results for your semester have not been published yet. Please check back later."*
- **No student record found (email not imported):** Show: *"Your account is not linked to any student record. Please contact the Exam Coordinator to have your data added."* The student dashboard shall display this message — NOT a blank page or an error screen.

---

### 3.2 Exam Coordinator Module

**FR-COORD-01: Student Import**
- The Coordinator shall upload an Excel file (.xlsx) containing student data.
- **CSPIT format:** `Roll No`, `Student Name` (optional `Sr No` column ignored). Department and semester come from import defaults in the UI; batch auto-derives from roll (`24IT` → `2024-2028`, `D25IT` → `D2025-2028` diploma).
- Also accepts legacy columns: Department, Semester, Batch, Email when present.
- Roll numbers: regular `24IT093` and diploma `D25IT131`.
- The system shall validate the file structure before processing.
- The import process shall act as an 'upsert'. If a Roll Number already exists, it will update their `Semester` and other details. This acts as the semester promotion mechanism.
- **NE (Not Eligible) is not imported via Excel.** NE is flagged per exam by the Coordinator before each internal (see FR-COORD-06).
- Successful import shall display a count of records added/updated.

**FR-COORD-02: Faculty Import**
- The Coordinator shall upload an Excel file (.xlsx) containing faculty data.
- **CSPIT format:** single-column name list (`DR./MR./MS.` prefixes stripped) matched to existing teacher accounts by name; department defaults to IT unless overridden.
- **Structured format:** Email slug (e.g. `nishatshaikh.it`), Full Name, optional Department.
- Same validation rules as student import apply.

**FR-COORD-03: Subject Management**
- The Coordinator shall create subjects with: Subject Code (unique), Subject Name, Department, Semester, Credit Hours (optional).
- The Coordinator shall edit or delete subjects (deletion restricted if marks already entered).

**FR-COORD-04: Subject Assignment**
- The Coordinator shall assign one or more subjects to a faculty member.
- A subject may be assigned to multiple faculty members simultaneously.
- Re-assignment is allowed before marks entry begins.

**FR-COORD-05: Examination Setup**
- The Coordinator shall define exams (assessments) for each subject, including Name, Date, Time, and Max Marks.
- A variable number of exams per subject is supported.

**FR-COORD-06: NE Flagging (per exam, not via import)**
- NE is **not** uploaded in the student Excel. The Coordinator flags NE from the student list **before each assessment** (Internal 1, Internal 2, etc.) for a given subject.
- Two supported methods: (1) checkbox per student on the list, or (2) enter a count of not-eligible students (coordinator confirms which students).
- NE is **per subject + per exam** — a student may be NE for Internal 1 but eligible for Internal 2 of the same subject.
- Teachers **shall enter marks** for NE-flagged students; the mark is stored but **never shown** on the student marksheet (student always sees "NE"). There is no coordinator toggle to reveal NE marks.

**FR-COORD-07: Marks Lock/Unlock**
- After a teacher submits, marks for that subject are locked.
- The Coordinator shall unlock marks for a subject to allow corrections.
- All unlock events shall be logged in the audit trail.

**FR-COORD-08: Report Generation**
- The Coordinator shall generate the following reports in PDF format:
  - Individual student marksheet (one student, one semester)
  - Semester-wise report (all students in a semester)
  - Subject-wise report (all students for one subject)
- Bulk download of all marksheets in a semester as a ZIP file (P2).

---

### 3.3 Teacher Module

**FR-TEACH-01: Subject Visibility**
- A teacher shall only see subjects assigned to them.
- No cross-subject or cross-faculty data shall be visible.

**FR-TEACH-02: Marks Entry**
- The teacher shall enter marks for each student per assessment component (including NE-flagged students).
- Marks shall be validated: 0 <= entered marks <= max marks for that assessment.
- The system shall reject values outside this range with a validation error.

**FR-TEACH-03: AB Flagging**
- The teacher shall mark a student as AB (Absent) for a specific assessment.
- AB-flagged entries shall display "AB" instead of marks.

**FR-TEACH-04: Marks Submission**
- The teacher shall submit marks per subject after completing entry.
- Upon submission, marks are locked and no further edits are possible unless the Coordinator unlocks.
- A confirmation dialog shall be shown before final submission.

**FR-TEACH-05: Submission Status**
- The teacher shall see the submission status of each assigned subject: Draft, Submitted, or Locked.

---

### 3.4 Student Module

**FR-STU-01: Marksheet View**
- Students shall view their marksheet only after the Coordinator publishes results.
- Students shall only be able to view their marks for the **current semester**. Historical marks are stored indefinitely but hidden from the student view.
- Marksheet shall display: Subject Name, Subject Code, Max Marks, Marks Obtained, and AB/NE flags.

**FR-STU-02: Overall Result**
- The system is strictly for marks revealing; there shall be no calculation of percentages, grades, or pass/fail status.

**FR-STU-03: PDF Download**
- Students shall download their marksheet as a PDF.
- The PDF shall include the institution name, student details, and all subject marks.

**FR-STU-04: Access Control**
- Students shall not see marks of other students under any circumstances.
- Cross-student data access via URL manipulation (IDOR) shall be prevented.

---

### 3.5 Calculation Engine

**FR-CALC-01:** The system shall not perform any grade, percentage, or pass/fail calculations. Its sole purpose is marks revealing.

---

### 3.6 Audit Trail

**FR-AUDIT-01:** Every marks insert, update, or deletion shall be logged.

**FR-AUDIT-02:** Each audit entry shall record: timestamp, action type (INSERT/UPDATE/DELETE), previous value, new value, user ID, user role, subject ID, student ID.

**FR-AUDIT-03:** The Coordinator shall view the full audit log, filterable by subject, date range, and user.

**FR-AUDIT-04:** Audit records shall be immutable (no deletes or updates to audit table).

---

## 4. Non-Functional Requirements

### 4.1 Performance
- API response time: < 500ms for 95th percentile under normal load
- PDF generation: < 5 seconds for individual, < 30 seconds for semester-batch
- Excel import: handle up to 1000 rows without timeout (async processing if needed)

### 4.2 Security
- All API endpoints require valid JWT
- HTTPS enforced in production
- Input sanitization on all text fields
- SQL injection prevention via Prisma ORM parameterized queries
- CORS restricted to allowed frontend origin
- Rate limiting on authentication endpoints (max 10 req/min per IP)

### 4.3 Scalability
- Stateless NestJS backend — horizontally scalable
- Supabase Postgres with PgBouncer connection pooling
- PDF generation can be offloaded to a queue (BullMQ) in M4

### 4.4 Reliability
- Database transactions for all multi-step operations (import, submission)
- Idempotent Excel import (re-upload does not create duplicates)
- Graceful error messages for all failure scenarios

### 4.5 Maintainability
- Full TypeScript on both frontend and backend
- Prisma schema as single source of truth for DB
- Modular NestJS architecture (one module per domain)

---

## 5. External Interface Requirements

### 5.1 User Interface
- Responsive web UI built in React (Vite)
- Supports Chrome, Firefox, Edge (latest 2 versions)
- Mobile-friendly but optimized for desktop

### 5.2 External APIs
- Supabase Postgres (database)
- (Optional) SendGrid or Nodemailer (email notifications — P2)

### 5.3 File Formats
- Input: .xlsx (Excel) for student and faculty imports
- Output: .pdf for marksheets and reports
- Template: downloadable .xlsx import template provided to Coordinator

---

## 6. Constraints

- All users must use an institutional email matching their role domain before first login
- The Coordinator must pre-register user emails before first login
- Marks cannot be altered by students under any condition
- Submitted marks require Coordinator intervention to edit
