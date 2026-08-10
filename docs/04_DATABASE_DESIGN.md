# Database Design Document
## IMMS — Internal Marks Management System

**Version:** 1.1  
**Date:** 2026-08-10  
**ORM:** Prisma  
**Database:** PostgreSQL (Supabase)

---

## 1. Entity Relationship Overview

`
AllowedUser (email whitelist)
    |
    | (1:1 on first login)
    |
User (authenticated users)
    |
    |─── (role = COORDINATOR) ──► manages everything below
    |─── (role = TEACHER) ──────► Faculty ──► SubjectAssignment
    |─── (role = STUDENT) ──────► Student ──► Mark
    
Subject (catalog) ──► SubjectOffering (per year/sem run)
                           |
         CIERound ─────────┼──► Assessment ──► Mark ◄── Student
         (dept-wide)       |         |
                           |         ▼
                           └──► SubjectAssignment ──► Faculty
                                     |
                                     ▼
                         [ AssessmentSubmission ] (per-exam state)
                                     |
                                     ▼
                                 AuditLog
`

---

## 2. Prisma Schema

`prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum Role {
  COORDINATOR
  TEACHER
  STUDENT
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  PUBLISHED
}

enum FlagType {
  AB // Absent
  NE // Not Eligible
  NONE // Normal
}

enum AuditAction {
  INSERT
  UPDATE
  DELETE
  SUBMIT
  UNLOCK
  PUBLISH
}

// ─────────────────────────────────────────────
// ALLOWED USERS (email whitelist)
// ─────────────────────────────────────────────

model AllowedUser {
  id        String   @id @default(cuid())
  email     String   @unique
  role      Role
  name      String?
  createdAt DateTime @default(now())
  createdBy String? // coordinator userId who added this entry

  user User?

  @@map("allowed_users")
}

// ─────────────────────────────────────────────
// USERS (email/password — created on account activation)
// ─────────────────────────────────────────────

model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String
  passwordHash        String
  needsPasswordChange Boolean  @default(true)
  profilePic          String?
  role                Role
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  allowedUserId String      @unique
  allowedUser   AllowedUser @relation(fields: [allowedUserId], references: [id])
  faculty       Faculty?
  student       Student?
  auditLogs     AuditLog[]
  enteredMarks  Mark[]      @relation("MarkEnteredBy")

  @@map("users")
}

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────

model Student {
  id         String   @id @default(cuid())
  rollNumber String   @unique
  name       String
  email      String   @unique
  department String
  semester   Int
  batch               String // e.g. "2024-2028" (B.Tech) or "2025-2028" (diploma)
  currentAcademicYear String // e.g. "2025-2026" — scopes marksheet/assignments
  isActive            Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id])
  marks  Mark[]

  @@index([department, semester])
  @@index([currentAcademicYear, semester])
  @@map("students")
}

// ─────────────────────────────────────────────
// FACULTY
// ─────────────────────────────────────────────

model Faculty {
  id          String   @id @default(cuid())
  facultyCode String   @unique
  name        String
  email       String   @unique
  department  String
  isActive    Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  userId      String?             @unique
  user        User?               @relation(fields: [userId], references: [id])
  assignments SubjectAssignment[]

  @@map("faculty")
}

// ─────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────

model Subject {
  id          String   @id @default(cuid())
  code        String   @unique // e.g. "CS301"
  name        String // e.g. "Data Structures"
  department  String
  semester    Int
  creditHours Int?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  offerings SubjectOffering[]

  @@map("subjects")
}

// ─────────────────────────────────────────────
// SUBJECT OFFERING (catalog subject in a term)
// ─────────────────────────────────────────────

model SubjectOffering {
  id           String   @id @default(cuid())
  subjectId    String
  academicYear String // e.g. "2025-2026"
  semester     Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subject     Subject             @relation(fields: [subjectId], references: [id])
  assessments Assessment[]
  assignments SubjectAssignment[]
  enrollments SubjectEnrollment[]

  @@unique([subjectId, academicYear, semester])
  @@index([academicYear, semester])
  @@map("subject_offerings")
}

// ─────────────────────────────────────────────
// CIE ROUNDS (shared internal exam rounds — CIE 1, CIE 2, …)
// ─────────────────────────────────────────────

model CIERound {
  id           String   @id @default(cuid())
  academicYear String
  semester     Int
  department   String
  name         String // e.g. "CIE 1"
  sequence     Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assessments Assessment[]

  @@unique([academicYear, semester, department, name])
  @@unique([academicYear, semester, department, sequence])
  @@map("cie_rounds")
}

// ─────────────────────────────────────────────
// SUBJECT ASSIGNMENT (Offering <-> Faculty)
// ─────────────────────────────────────────────

model SubjectAssignment {
  id                String   @id @default(cuid())
  subjectOfferingId String
  facultyId         String
  startRollNumber   String?
  endRollNumber     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  subjectOffering       SubjectOffering        @relation(fields: [subjectOfferingId], references: [id])
  faculty               Faculty                @relation(fields: [facultyId], references: [id])
  marks                 Mark[]
  assessmentSubmissions AssessmentSubmission[]
  roster                SubjectAssignmentRoster[]

  @@unique([subjectOfferingId, facultyId])
  @@map("subject_assignments")
}

// ─────────────────────────────────────────────
// SUBJECT ASSIGNMENT ROSTER (explicit per-teacher roll list)
// ─────────────────────────────────────────────

model SubjectAssignmentRoster {
  id                  String   @id @default(cuid())
  subjectAssignmentId String
  studentId           String
  createdAt           DateTime @default(now())

  subjectAssignment SubjectAssignment @relation(fields: [subjectAssignmentId], references: [id], onDelete: Cascade)
  student           Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([subjectAssignmentId, studentId])
  @@index([studentId])
  @@map("subject_assignment_rosters")
}

// ─────────────────────────────────────────────
// ASSESSMENTS (one subject offering × one CIE round — a CIE exam instance)
// ─────────────────────────────────────────────

model Assessment {
  id                String    @id @default(cuid())
  subjectOfferingId String
  cieRoundId        String
  examDate          DateTime?
  examTime          String? // e.g. "10:00 AM"
  maxMarks          Decimal   @db.Decimal(5, 2)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  subjectOffering SubjectOffering        @relation(fields: [subjectOfferingId], references: [id])
  cieRound        CIERound               @relation(fields: [cieRoundId], references: [id])
  marks           Mark[]
  submissions     AssessmentSubmission[]

  @@unique([subjectOfferingId, cieRoundId])
  @@map("assessments")
}

// ─────────────────────────────────────────────
// ASSESSMENT SUBMISSIONS (per-exam, per-teacher state)
// ─────────────────────────────────────────────

model AssessmentSubmission {
  id                  String @id @default(cuid())
  subjectAssignmentId String
  assessmentId        String

  status      SubmissionStatus @default(DRAFT)
  submittedAt DateTime?
  publishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subjectAssignment SubjectAssignment @relation(fields: [subjectAssignmentId], references: [id])
  assessment        Assessment        @relation(fields: [assessmentId], references: [id])

  @@unique([subjectAssignmentId, assessmentId])
  @@map("assessment_submissions")
}

// ─────────────────────────────────────────────
// MARKS
// ─────────────────────────────────────────────

model Mark {
  id                  String   @id @default(cuid())
  studentId           String
  assessmentId        String
  subjectAssignmentId String
  marksObtained       Decimal? @db.Decimal(5, 2) // null if AB. NE students have marks entered but they are NEVER shown to students — student always sees "NE".
  flag                FlagType @default(NONE)
  enteredById         String? // faculty userId who entered
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  student           Student           @relation(fields: [studentId], references: [id])
  assessment        Assessment        @relation(fields: [assessmentId], references: [id])
  subjectAssignment SubjectAssignment @relation(fields: [subjectAssignmentId], references: [id])
  enteredBy         User?             @relation("MarkEnteredBy", fields: [enteredById], references: [id])
  auditLogs         AuditLog[]

  @@unique([studentId, assessmentId, subjectAssignmentId])
  @@index([studentId])
  @@index([assessmentId])
  @@index([subjectAssignmentId])
  @@map("marks")
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

model AuditLog {
  id            String      @id @default(cuid())
  action        AuditAction
  tableName     String // which table was affected
  recordId      String // ID of the record affected
  previousValue Json? // previous state (for UPDATE/DELETE)
  newValue      Json? // new state (for INSERT/UPDATE)
  markId        String?
  userId        String
  userRole      Role
  ipAddress     String?
  createdAt     DateTime    @default(now())

  mark Mark? @relation(fields: [markId], references: [id], onDelete: SetNull)
  user User  @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([recordId])
  @@map("audit_logs")
}
`

---

## 3. Table Descriptions

### 3.1 allowed_users
Pre-registration whitelist. Coordinator adds emails here before anyone can log in. Determines role when the user record is created at activation.

### 3.2 users
Created when the user completes activation (`POST /auth/activate`) and sets their password. Links to `allowed_users` via id.
**Security invariant:** `AuthService` validates that the activation token email matches `allowedUser.email` and that the email domain matches the assigned role before creating the user. Role cannot be changed post-creation without coordinator intervention.

> **Code status:** Google OAuth is **not implemented**. There is no `googleId` column; auth uses `passwordHash` and `needsPasswordChange`.

### 3.3 students
Imported via Excel. Linked to User on first login via email match. If the user has not activated yet, userId is null. **`currentAcademicYear`** scopes which offering's assignments and marks appear on the marksheet (derived from batch + semester on import; coordinator can override for backlog/repeat).

### 3.4 faculty
Imported via Excel. Linked to User on first login. Must exist before subject assignment.

### 3.5 subjects
Catalog only (code, name, department, semester slot). CIE exams (`Assessment` rows) and teacher assignments live on **subject offerings**, not the catalog row. Deletion restricted if marks exist.

### 3.6 subject_offerings
One row per `(subject, academicYear, semester)` — e.g. OS in 2026–2027 Sem 5. Owns CIE exams, assignments, and elective enrollments for that run. 25IT next year gets a separate offering even though the catalog subject is the same.

### 3.7 cie_rounds
**CIE** = Continuous Internal Evaluation (the internal exam name used across the college). A CIERound is a **shared internal exam round** for a department in a given academic year and semester — e.g. CIE 1, CIE 2 for IT Sem 5 2026–2027. All subject offerings in that scope link their per-subject exams to the same round so the student marksheet can group results by CIE. Variable count per year; `sequence` orders rounds on the marksheet.

### 3.8 subject_assignments
Links a **subject offering** to a faculty member (optional roll range **or** explicit roster). Defines the teacher's class for that term. When `subject_assignment_rosters` rows exist for an assignment, the marks grid uses that explicit list instead of dept/sem/year cohort or roll range.

### 3.8a subject_assignment_rosters
Explicit roll-number list for one teacher's assignment — alternative to typed `startRollNumber`/`endRollNumber`. Adding a student here also creates a `subject_enrollments` row so backlog students bypass normal cohort filters on marksheet and grid queries.

### 3.9 assessments
One row per `(subjectOffering, cieRound)` — the subject's exam for that CIE round. Holds maxMarks, examDate, examTime. Display name comes from `cie_rounds.name`, not a free-text field on the assessment. (API/model name remains `Assessment`.)

### 3.10 assessment_submissions
Tracks the state of a specific CIE exam (`Assessment`) for a specific teacher's class (`SubjectAssignment`). Tracks `status` (DRAFT → SUBMITTED → PUBLISHED). NE student visibility is NOT controlled here — NE marks are permanently hidden from students by design.

### 3.11 marks
Core marks record. One row per student per assessment per subject_assignment. The `flag` determines AB/NE/NONE. `marksObtained` is null for AB only. For NE students, the teacher CAN enter a mark (it is stored), but the student's marksheet always shows "NE" regardless — the mark is never revealed. Editing is governed by the related `assessment_submissions` status.

### 3.12 audit_logs
Immutable log of all marks-related changes. previousValue and newValue stored as JSON for full diff visibility. Never updated or deleted.

---

## 4. Calculated Fields (Not Stored — Computed on Query)

The system does not calculate grades, pass/fail status, or percentages, as its sole purpose is marks revealing. Only basic totals may be computed at query time if necessary for reporting:

| Field | Formula |
|---|---|
| totalMarksObtained | SUM(marks.marksObtained) per student per subjectAssignment |
| totalMaxMarks | SUM(assessments.maxMarks) per subjectAssignment |

---

## 5. Excel Import Column Mapping

> **Source of truth for code:** `imms-backend/src/import/config/import-columns.config.ts`  
> Edit `templateHeader` / `headers` arrays there when the college changes format. Templates regenerate automatically.

### Students Excel Template
| Column | Field | Required in file |
|---|---|---|
| Roll No | rollNumber | Yes |
| Student Name | name | Yes |
| Department | department | No — auto from roll prefix (`24IT`→`IT`) or import default (UI) |
| Semester | semester | No — import default (UI) |
| Batch | batch | No — auto from roll (`24IT`→`2024-2028`, `D25IT`→`2025-2028`) |
| Email | email | No — auto from roll number |

**Roll formats:** `24IT093` (B.Tech), `D25IT131` (diploma).

> **NE is not an import column.** Coordinator flags NE per exam in the marks workflow (Milestone 2). Stored on each `marks` row (`flag = NE`), not on the student profile.

### Faculty Excel Template
| Column | Field | Required in file |
|---|---|---|
| Email slug | facultyCode | Yes (structured format only) |
| Full Name / name list | name | Yes |
| Department | department | No — import default (UI, default IT) |
| Email | email | No — auto from slug (`slug@charusat.ac.in`) |

**Name-list format:** first column only (e.g. `CSPIT-IT STAFF.xlsx`) — no headers; names matched to Account Management teacher accounts.
