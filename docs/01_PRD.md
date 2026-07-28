# Product Requirements Document (PRD)
## IMMS — Internal Marks Management System

**Version:** 1.0  
**Date:** 2026-07-24  
**Status:** Draft — Pending Stakeholder Approval  

---

## 1. Executive Summary

IMMS is a role-based web application built exclusively for **department-level internal marks management**. It covers the full marks lifecycle — from student/faculty data import, through marks entry by teachers, to automated marksheet and report generation.

Access is restricted to institutional email addresses only (configured domain). The system replaces manual spreadsheet-based processes with a centralized, audited, and access-controlled platform.

---

## 2. Problem Statement

Academic institutions currently manage examination marks through disconnected Excel files and manual processes. This creates:

- **Data integrity risks** — no validation, easy overwrites, no audit trail
- **Access control gaps** — marks visible/editable by unauthorized users
- **Reporting overhead** — manual compilation of subject-wise and semester-wise reports
- **No student self-service** — students cannot view results without coordinator involvement

---

## 3. Goals

- Centralize internal marks management for all subjects and semesters within the department
- Restrict access to institutional email domain only — no external accounts permitted
- Enforce role-based access: Coordinator > Teacher > Student
- Automate marksheet and report generation (PDF)
- Provide an audit trail for all marks entries and updates
- Support Excel-based bulk import for students and faculty
- Handle AB (Absent) and NE (Not Eligible) flags, with coordinator-controlled visibility for NE students
- Retain all historical marks while restricting student view to only their current semester
- Match student Google login to their roll number record; show clear status when record is unlinked

---

## 4. Target Users & Scale

| Role | Count (Estimated) | Primary Device |
|---|---|---|
| Exam Coordinator | 1-3 | Desktop/Laptop |
| Teacher (Faculty) | 20-50 | Desktop/Laptop |
| Student | 500-800 | Desktop/Mobile Browser |

**Peak load scenario:** All teachers submitting marks simultaneously at semester end.

---

## 5. User Personas

### 5.1 Exam Coordinator
- **Goal:** Manage all examination data end-to-end; generate reports on demand
- **Pain point:** Chasing teachers for mark sheets, manually compiling data, no audit visibility
- **Behavior:** Uses the system at semester start (setup) and semester end (reporting)

### 5.2 Teacher (Faculty)
- **Goal:** Enter marks for assigned subjects quickly and accurately; submit on time
- **Pain point:** Accessing marks data outside their subjects; accidental overwrites
- **Behavior:** Uses the system during the marks entry window; submits once

### 5.3 Student
- **Goal:** View personal marksheet and download PDF
- **Pain point:** Waiting for physical marksheets; unclear pass/fail status
- **Behavior:** Accesses the system post-results publication; single session, low frequency

---

## 6. Feature Requirements

### 6.1 Authentication and Authorization
| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Google OAuth 2.0 login for all three roles | P0 |
| AUTH-02 | **Domain restriction**: only emails from the configured institutional domain (e.g. `@college.ac.in`) are permitted — all others rejected at login | P0 |
| AUTH-03 | Role assignment tied to Google account email on first login | P0 |
| AUTH-04 | Session management with JWT tokens | P0 |
| AUTH-05 | Role-based route guards (Coordinator / Teacher / Student) | P0 |
| AUTH-06 | Coordinator can pre-register allowed emails per role | P0 |
| AUTH-07 | **Student identity matching**: after login, system looks up student record by email. If no record found → show "Your account is not linked to any student record. Contact the Coordinator." instead of empty dashboard | P0 |
| AUTH-08 | If results not yet published for student's semester → show "Results have not been published yet" (not a blank page) | P0 |

### 6.2 Exam Coordinator Features
| ID | Requirement | Priority |
|---|---|---|
| COORD-01 | Upload student list via Excel (.xlsx) | P0 |
| COORD-02 | Upload faculty list via Excel (.xlsx) | P0 |
| COORD-03 | Add, edit, and delete subjects (name + code) | P0 |
| COORD-04 | Assign teachers for mark entry of specific subjects | P0 |
| COORD-05 | Define exams per subject (Name, Date, Time, Max Marks) with variable number of exams | P0 |
| COORD-06 | Flag students as NE (Not Eligible) and toggle visibility of marks for NE students | P0 |
| COORD-07 | Lock/unlock marks submission per subject | P0 |
| COORD-08 | Generate semester-wise reports (PDF) | P0 |
| COORD-09 | Generate subject-wise reports (PDF) | P0 |
| COORD-10 | Generate individual student marksheets (PDF) | P0 |
| COORD-11 | View audit trail of all marks changes | P1 |
| COORD-12 | Download bulk marksheets as ZIP | P2 |

### 6.3 Teacher Features
| ID | Requirement | Priority |
|---|---|---|
| TEACH-01 | View only assigned subjects | P0 |
| TEACH-02 | Enter marks for students in assigned subjects | P0 |
| TEACH-03 | Update marks before submission | P0 |
| TEACH-04 | Flag students as AB (Absent) | P0 |
| TEACH-05 | Submit marks (locks entry for that subject) | P0 |
| TEACH-06 | View submission status per subject | P1 |

### 6.4 Student Features
| ID | Requirement | Priority |
|---|---|---|
| STU-01 | View personal marksheet for the current semester only | P0 |
| STU-02 | Download personal marksheet as PDF | P0 |
| STU-03 | View AB/NE flags (NE marks hidden unless explicitly enabled by Coordinator) | P0 |
| STU-04 | View subject-wise and exam-wise marks breakdown | P0 |

### 6.5 System Cross-Cutting
| ID | Requirement | Priority |
|---|---|---|
| SYS-01 | Validate marks do not exceed defined max marks | P0 |
| SYS-02 | No grade or pass/fail calculations; the system is strictly for marks revealing | P0 |
| SYS-03 | Display AB/NE flags visibly in marksheets | P0 |
| SYS-04 | Audit log: who entered/updated marks, when | P0 |
| SYS-06 | Optional email notifications on marks publication | P2 |

---

## 7. User Stories

### Coordinator
- As a Coordinator, I want to upload an Excel file of students so I do not have to manually add each student.
- As a Coordinator, I want to lock marks after a teacher submits so they cannot be modified without my intervention.
- As a Coordinator, I want to generate a full semester report in PDF so I can submit it to the examination committee.

### Teacher
- As a Teacher, I want to see only my assigned subjects so I am not overwhelmed with irrelevant data.
- As a Teacher, I want to mark a student as AB so their absence is formally recorded.
- As a Teacher, I want to submit marks in one click so I do not accidentally leave them in draft.

### Student
- As a Student, I want to log in with my Google account and see my current semester's marks immediately after publication.
- As a Student, I want to download my marksheet as a PDF for visa and job applications.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Page load under 2s; PDF generation under 5s for individual marksheets |
| Scalability | Support 500-800 concurrent users at semester end |
| Security | HTTPS enforced; JWT with refresh tokens; no cross-role data leakage |
| Availability | 99.5% uptime SLA; graceful error handling for Supabase outages |
| Accessibility | WCAG 2.1 AA — keyboard navigable, screen reader friendly |
| Browser Support | Chrome, Firefox, Edge (latest 2 versions each) |

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Marks entry time vs. manual | 50%+ reduction |
| PDF generation success rate | 99%+ |
| Teacher submission completion rate | 100% by deadline |
| Student marksheet access within 24h of publication | 90%+ |
| Zero unauthorized cross-role data access incidents | Required |

---

## 10. Dependencies and Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Institution uses non-Google email accounts | Medium | High | Allow coordinator to map external emails to Google accounts |
| Excel format inconsistency across batches | High | Medium | Provide strict template download; validate on upload |
| PDF library performance at bulk generation | Medium | Medium | Queue-based PDF generation for bulk exports |
| Supabase free tier connection limits | Medium | High | Use connection pooling (PgBouncer) built into Supabase |

---

## 11. Release Milestones

| Milestone | Scope |
|---|---|
| M1 - Foundation | Auth, role setup, student/faculty import |
| M2 - Core | Subject management, marks entry, AB/NE flags |
| M3 - Reporting | PDF generation, marksheets, reports |
| M4 - Polish | Audit trail, notifications, bulk export |
