# AI Insurance Claims Intelligence Platform

An intelligent, multi-agent insurance claims processing and assessment platform with a strictly decoupled architecture, Supabase PostgreSQL persistence, and Google Gemini AI orchestration.

---

## 🏛️ Monorepo & Architectural Overview

This repository is organized as an **npm workspace** containing two independent applications:

```text
insurance-claims-ai/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (lint, test, build)
├── frontend/                  # Next.js App Router client application
│   ├── app/                   # Next.js pages & layouts
│   ├── components/            # UI components (Radix + Tailwind CSS)
│   ├── package.json           # Frontend dependencies & scripts
│   └── tsconfig.json
│
├── backend/                   # Express + TypeScript claims intelligence service
│   ├── src/
│   │   ├── api/               # REST controllers, routes & middleware
│   │   ├── agents/            # Autonomous AI agents (Document, Policy, Coverage, Anomaly, Missing Info, Assessment, Settlement)
│   │   ├── orchestration/     # Multi-agent claim investigation pipeline
│   │   ├── claims/            # Claim CRUD, reviews & settlements
│   │   ├── services/          # Gemini GenAI, SMTP & HTML email templates
│   │   ├── repositories/      # Unified data access layer (Supabase + in-memory store)
│   │   └── index.ts           # Server entry point
│   ├── migrations/            # Supabase PostgreSQL schema, RLS policies & seed data
│   ├── tests/                 # Automated test suites (36 tests, 100% passing)
│   ├── package.json           # Backend dependencies & scripts
│   └── tsconfig.json
│
├── package.json               # Root workspace configuration
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start (Root Monorepo)

### 1. Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+)

### 2. Install Dependencies
Run in the repository root:
```bash
npm install
```

### 3. Start Both Backend & Frontend Concurrently
From the root folder:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Next.js**: `http://localhost:3000`

### 4. Lint Both Applications
From the root folder:
```bash
npm run lint
```
Runs `tsc --noEmit` on the backend and `eslint .` on the frontend.

### 5. Build Both Applications
From the root folder:
```bash
npm run build
```
Compiles TypeScript for the backend and creates an optimized production Next.js build for the frontend.

### 6. Run Test Suite
From the root folder:
```bash
npm test
```
Executes all 36 backend tests verifying authentication, role guards, document storage, multi-agent AI pipeline, and settlement authorization.

---

## ⚙️ Independent Application Commands

You can also run commands inside individual workspaces:

### Backend
```bash
cd backend
npm run dev        # Run backend with hot-reload (tsx)
npm run lint       # Run backend type checking
npm run test       # Run Vitest test suites
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled production server
```

### Frontend
```bash
cd frontend
npm run dev        # Run Next.js development server
npm run lint       # Run ESLint
npm run build      # Create Next.js production build
npm start          # Run Next.js production server
```

---

## 🔄 GitHub Actions CI

Every push or pull request to the `main` branch triggers `.github/workflows/ci.yml`:
1. **Lint & Type Check**: Runs `npm run lint` across all workspaces.
2. **Backend Unit & Integration Tests**: Runs `npm test` across all 36 test suites.
3. **Monorepo Build**: Compiles both backend and frontend applications.

---

## 🛡️ License
Proprietary / Internal — AI Insurance Claims Intelligence Project
