# Internal Marks Management System (IMMS) - Frontend

This repository houses the **Frontend Application** and **Core Documentation** for the Internal Marks Management System (IMMS).

## 📚 Documentation Index

All architectural and design documentation for both the frontend and backend is centralized in the `docs/` folder of this repository. Please read them in the following order to understand the system:

1. **[01_PRD.md](./docs/01_PRD.md)** - Product Requirements Document (Core vision and scope).
2. **[02_SRS.md](./docs/02_SRS.md)** - Software Requirements Specification (User workflows and functional requirements).
3. **[03_ARCHITECTURE.md](./docs/03_ARCHITECTURE.md)** - System Architecture (Frontend vs Backend responsibilities, Tech stack).
4. **[04_DATABASE_DESIGN.md](./docs/04_DATABASE_DESIGN.md)** - Database Schema and Design (The single source of truth for the data model).
5. **[05_API_SPECIFICATION.md](./docs/05_API_SPECIFICATION.md)** - API Spec (REST endpoints and data contracts).
6. **[06_TASK_BREAKDOWN.md](./docs/06_TASK_BREAKDOWN.md)** - Development Epics and Sprints.
7. **[07_DEPLOYMENT_PLAN.md](./docs/07_DEPLOYMENT_PLAN.md)** - Hosting and Deployment Strategy.
8. **[HOW_IT_WORKS.md](../HOW_IT_WORKS.md)** - A high-level, human-readable summary of the entire application workflow.

## 🚀 Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS v4
- **Routing:** React Router v7
- **State Management:** Zustand (user profile only — tokens in httpOnly cookies)
- **API Client:** Axios with `withCredentials: true`
- **Server state:** `@tanstack/react-query` — coordinator dashboard reads/writes via `src/hooks/` (5 min staleTime)

## 🔍 Audit & Known Issues

See **[`../AUDIT_REPORT.md`](../AUDIT_REPORT.md)** for security, N+1 performance, and code quality findings.  
Living dev context: **[`context.md`](./context.md)** (includes known-issues summary).

## 🛠️ Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables (copy `.env.example` to `.env`).
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Key Pages

| Route | File | What it does |
|---|---|---|
| `/login` | `src/pages/Login.tsx` | Sign in with roll number (students) or staff email + password |
| `/activate#token=…` | `src/pages/ActivateAccount.tsx` | First-time password setup from coordinator activation link (token read from hash, posted in body) |
| `/student` | `src/pages/student/Marksheet.tsx` | Student marksheet (inside `StudentShell`) |
| `/coordinator` | `src/pages/coordinator/Dashboard.tsx` | Coordinator dashboard |
| `/teacher` | `src/pages/teacher/Dashboard.tsx` | Teacher dashboard |

Public auth pages share layout in `src/components/auth/`. Student portal layout lives in `src/components/student/`. See **[context.md](./context.md)** for the full route map and project structure.
