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
- **State Management:** Zustand
- **API Client:** Axios

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
