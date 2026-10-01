# AI Insurance Claims Intelligence — Backend API

A modular, evidence-backed multi-agent claims intelligence engine built with Express, TypeScript, Supabase PostgreSQL, and Gemini API.

---

## 🏛️ System Architecture

```text
backend/
├── migrations/                     # PostgreSQL DDL & RLS Security Policies
│   ├── 001_initial_schema.sql      # Core tables, UUIDs, foreign keys & indexes
│   ├── 002_rls_policies.sql        # Row Level Security tenant & role isolation
│   └── 003_seed_policies.sql       # Seed insurance policies & clauses for RAG
├── src/
│   ├── agents/                     # Specialized, testable AI Agents
│   │   ├── documentAgent.ts        # Multimodal OCR & field extraction + evidence
│   │   ├── policyAgent.ts          # Policy retrieval & chunk evidence tracking
│   │   ├── coverageAgent.ts        # Coverage evaluation against policy evidence
│   │   ├── anomalyAgent.ts         # Cross-document inconsistency & anomaly detection
│   │   ├── missingInformationAgent.ts # Requirement & documentation checklist validator
│   │   ├── assessmentAgent.ts      # Multi-agent synthesis & complexity recommendation
│   │   └── settlementAgent.ts      # AI settlement recommendation advisory
│   ├── orchestration/
│   │   └── claimInvestigationService.ts # Autonomous multi-agent pipeline orchestrator
│   ├── claims/
│   │   ├── claimService.ts         # Claim lifecycle management
│   │   ├── reviewService.ts        # Human officer decision & information request service
│   │   └── settlementService.ts    # Settlement authorization & execution
│   ├── document-processing/
│   │   └── storageService.ts       # Magic-byte file validation & Supabase Storage integration
│   ├── services/
│   │   ├── geminiService.ts        # Centralized Google GenAI / Gemini client
│   │   ├── emailService.ts         # SMTP delivery with error isolation & db logging
│   │   └── emailTemplateService.ts # Branded, accessible HTML email templates
│   ├── repositories/
│   │   ├── index.ts                # Unified data-access layer (Supabase + local store fallback)
│   │   └── inMemoryStore.ts        # Local in-memory repository store for tests
│   ├── middleware/
│   │   ├── auth.ts                 # Supabase JWT verification & role guards
│   │   ├── errorHandler.ts         # Centralized error handler
│   │   └── requestId.ts            # Request ID tracing middleware
│   ├── api/
│   │   ├── claimRoutes.ts          # Express route bindings with role guards
│   │   ├── claimController.ts      # Claim CRUD & timeline controller
│   │   ├── documentController.ts   # Document upload & download controller
│   │   ├── investigationController.ts # Investigation pipeline trigger & query controller
│   │   ├── reviewController.ts     # Human review decision controller
│   │   ├── settlementController.ts # Settlement authorization controller
│   │   └── auditController.ts      # Compliance audit logs controller
│   ├── config/
│   │   ├── env.ts                  # Zod environment variable parsing & validation
│   │   ├── cors.ts                 # Strict frontend origin CORS policy
│   │   └── supabase.ts             # Supabase client initialization & helper
│   ├── schemas/                    # Zod validation schemas for all requests
│   ├── types/                      # TypeScript domain & database entity definitions
│   └── index.ts                    # Server bootstrap & middleware assembly
├── tests/                          # Automated Vitest test suites (36 tests)
│   ├── auth_and_roles.test.ts
│   ├── claims_crud.test.ts
│   ├── documents_and_storage.test.ts
│   ├── agents_and_investigation.test.ts
│   ├── settlement_and_review.test.ts
│   └── email_and_cors.test.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication & Roles

Authentication is backed by Supabase Auth JWTs passed in the `Authorization: Bearer <token>` header. Roles are stored in the server-side `profiles` table and cannot be modified by claimants:

- `CLAIMANT`: Submits claims and uploads supporting documents. Can only view and modify their own claims.
- `CLAIMS_OFFICER`: Assesses coverage, reviews AI findings, requests additional information, and authorizes settlements.
- `INVESTIGATOR`: Investigates potential anomalies, inconsistencies, and complex claims.
- `ADMIN`: Full administrative visibility and audit access.

---

## ⚡ Multi-Agent Investigation Flow

When `POST /api/claims/:id/investigate` is called:
1. **Document Agent**: Inspects uploaded files (PDF, PNG, JPG), parses text/images via Gemini multimodal API, extracts structured fields, and saves `Evidence` records.
2. **Policy/RAG Agent**: Retrieves clauses matching policy number and claim type, tracking section, page number, and source text into `Evidence` records.
3. **Coverage Agent**: Evaluates claim eligibility against retrieved policy clauses. Assigns coverage status (`COVERED`, `POTENTIALLY_COVERED`, `REQUIRES_REVIEW`, etc.) and attaches evidence IDs.
4. **Anomaly Agent**: Cross-references dates, amounts, policy numbers, and descriptions across documents. Flags potential inconsistencies using objective terminology (never labels fraud directly).
5. **Missing Information Agent**: Compares claim documentation against required checklist items and requests missing documentation.
6. **Assessment Agent**: Synthesizes agent evaluations, determines claim complexity (`LOW`, `MEDIUM`, `HIGH`), and issues a recommendation (`automated_processing` or `human_review`).
7. **Settlement Authorization**: Only authorized claims officers or admins can execute settlements. Claims flagged for human review must receive formal review approval before payout.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase, Gemini, and Gmail SMTP credentials.

### 3. Run Tests
```bash
npm test
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm start
```
