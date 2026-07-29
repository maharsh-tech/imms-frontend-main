# Database Design Document
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
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
    
Subject ──────────────────────► SubjectAssignment ──► Faculty
   |                                    |
   |                                    ▼
   |                        [ AssessmentSubmission ] (per-exam state)
   |                                    |
   └──────► Assessment ──► Mark ◄───── Student
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
// USERS (after Google OAuth login)
// ─────────────────────────────────────────────

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  googleId   String   @unique
  profilePic String?
  role       Role
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

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
  batch      String // e.g. "2023-2027"
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id])
  marks  Mark[]

  @@index([department, semester])
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

  assignments SubjectAssignment[]
  assessments Assessment[]

  @@map("subjects")
}

// ─────────────────────────────────────────────
// SUBJECT ASSIGNMENT (Subject <-> Faculty)
// ─────────────────────────────────────────────

model SubjectAssignment {
  id           String   @id @default(cuid())
  subjectId    String
  facultyId    String
  semester     Int
  academicYear String // e.g. "2025-2026"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subject               Subject                @relation(fields: [subjectId], references: [id])
  faculty               Faculty                @relation(fields: [facultyId], references: [id])
  marks                 Mark[]
  assessmentSubmissions AssessmentSubmission[]

  @@unique([subjectId, facultyId, academicYear])
  @@index([academicYear, semester])
  @@map("subject_assignments")
}

// ─────────────────────────────────────────────
// ASSESSMENTS (exam components per subject)
// ─────────────────────────────────────────────

model Assessment {
  id        String    @id @default(cuid())
  subjectId String
  name      String // e.g. "Internal", "External", "Practical"
  examDate  DateTime?
  examTime  String? // e.g. "10:00 AM"
  maxMarks  Decimal   @db.Decimal(5, 2)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  subject     Subject                @relation(fields: [subjectId], references: [id])
  marks       Mark[]
  submissions AssessmentSubmission[]

  @@unique([subjectId, name])
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
Pre-registration whitelist. Coordinator adds emails here before anyone can log in. Determines role on first Google OAuth login.

### 3.2 users
Created on first successful Google login. Links to `allowed_users` via id. 
**Security invariant:** The application-layer logic (NestJS AuthService) must explicitly assert `googleEmail === allowedUser.email` before inserting a new user. The schema relations no longer enforce this automatically. *(Note: This assertion is a requirement for the upcoming Authentication implementation in Epic 1.3; it does not exist in code yet).* Role cannot be changed post-creation without coordinator intervention.

### 3.3 students
Imported via Excel. Linked to User on first login via email match. If no Google account exists yet, userId is null.

### 3.4 faculty
Imported via Excel. Linked to User on first login. Must exist before subject assignment.

### 3.5 subjects
Defined by Coordinator. One subject can have a variable number of assessments/exams. Deletion restricted if marks exist.

### 3.6 subject_assignments
Links a subject to a faculty for a given academic year and semester. This defines the teacher's class for the term.

### 3.7 assessments
Exam components under a subject, defined by Coordinator with name, date, time, and maxMarks.

### 3.8 assessment_submissions
Tracks the state of a specific exam (Assessment) for a specific teacher's class (SubjectAssignment). Tracks `status` (DRAFT → SUBMITTED → PUBLISHED). NE student visibility is NOT controlled here — NE marks are permanently hidden from students by design.

### 3.9 marks
Core marks record. One row per student per assessment per subject_assignment. The `flag` determines AB/NE/NONE. `marksObtained` is null for AB only. For NE students, the teacher CAN enter a mark (it is stored), but the student's marksheet always shows "NE" regardless — the mark is never revealed. Editing is governed by the related `assessment_submissions` status.

### 3.10 audit_logs
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
| Column | Field | Required |
|---|---|---|
| Roll Number | rollNumber | Yes |
| Full Name | name | Yes |
| Email | email | Yes |
| Department | department | Yes |
| Semester | semester | Yes |
| Batch | batch | Yes |

> **NE is not an import column.** Coordinator flags NE per exam in the marks workflow (Milestone 2). Stored on each `marks` row (`flag = NE`), not on the student profile.

### Faculty Excel Template
| Column | Field | Required |
|---|---|---|
| Faculty ID | facultyCode | Yes |
| Full Name | name | Yes |
| Email | email | Yes |
| Department | department | Yes |
