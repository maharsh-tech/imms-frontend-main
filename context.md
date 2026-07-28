# IMMS Frontend — Project Context

> Living document. Updated after each epic completes.

## Quick Reference

| Property | Value |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Client State | Zustand (auth store) |
| Server State | @tanstack/react-query |
| HTTP Client | Axios with interceptors |
| Routing | React Router v7 |
| Node Version | 20 LTS |
| Package Manager | npm |
| Git Remote | https://github.com/maharsh-tech/imms-frontend-main.git |

## Project Structure

```
imms-frontend/
├── docs/                          # Shared project documentation (PRD, SRS, etc.)
├── public/
├── src/
│   ├── main.tsx                   # Entry: StrictMode + QueryClientProvider
│   ├── App.tsx                    # BrowserRouter + route definitions
│   ├── index.css                  # Tailwind CSS v4 entry (@import "tailwindcss")
│   ├── api/
│   │   └── client.ts             # Axios instance with auth interceptors
│   ├── components/
│   │   ├── layout/               # Header, Sidebar, PageWrapper (stubs)
│   │   ├── shared/               # DataTable, FileUpload, etc. (stubs)
│   │   └── marks/                # MarksTable, FlagCell (stubs)
│   ├── hooks/                    # Custom hooks (stubs)
│   ├── pages/
│   │   ├── Login.tsx             # Placeholder login page
│   │   ├── coordinator/
│   │   │   └── Dashboard.tsx     # Placeholder
│   │   ├── teacher/
│   │   │   └── Dashboard.tsx     # Placeholder
│   │   └── student/
│   │       └── Marksheet.tsx     # Placeholder
│   ├── routes/
│   │   ├── PrivateRoute.tsx      # Auth guard (UX only)
│   │   └── RoleRoute.tsx         # Role guard (UX only)
│   ├── stores/
│   │   └── authStore.ts          # Zustand auth state
│   └── types/
│       └── index.ts              # TypeScript types mirroring Prisma enums
├── package.json
├── vite.config.ts                 # React + Tailwind plugins
├── tsconfig.json
├── .env.example
├── .gitignore
└── context.md                     # ← You are here
```

## Implemented Features

- [x] **Epic 1.1** — Project Scaffolding
  - Vite + React + TypeScript initialized
  - Tailwind CSS v4 configured with Vite plugin
  - React Router with nested route guards (PrivateRoute → RoleRoute)
  - Zustand auth store (in-memory token storage)
  - Axios client with Bearer token injection and 401 refresh interceptor
  - React Query provider with 5-minute stale time
  - Placeholder pages for all three roles
  - TypeScript types mirroring Prisma enums
  - `.env.example` with VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID
- [ ] **Epic 1.3** — Authentication (login page, OAuth callback, token storage)
- [ ] **Epic 1.5** — Excel Import (file upload component)

## Key Conventions

- **Pages:** `src/pages/{role}/` — one directory per role (coordinator, teacher, student)
- **Shared components:** `src/components/shared/` — reusable across all roles
- **All API calls** go through `src/api/client.ts` (centralized Axios instance)
- **Auth state** in Zustand store (`src/stores/authStore.ts`)
- **Server data** via React Query hooks (defined in `src/hooks/`)
- **Route guards are UX only** — `PrivateRoute` and `RoleRoute` redirect unauthorized users, but the backend independently enforces RBAC
- **Environment variables** must be prefixed with `VITE_` to be exposed to client code
- **No business logic in frontend** — all validation, authorization, and calculations happen on the backend

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (public) | — |

## Known Issues / Tech Debt

- Vite scaffold includes unused `assets/` and SVG files — can be cleaned up
- Route guards redirect to `/login` even for role mismatches — consider a `/unauthorized` page later

## Last Updated

**Epic 1.1 — Project Scaffolding** (2026-07-28)
