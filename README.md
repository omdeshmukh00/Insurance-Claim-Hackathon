# AI Insurance Claims Intelligence Platform

An intelligent, multi-agent insurance claims processing and assessment system designed with a strict decoupled architecture.

---

## 🏛️ Architectural Overview

This repository is strictly partitioned into two independent applications:

```text
insurance-claims-ai/
├── frontend/                 # Decoupled Next.js client application
│   ├── src/
│   │   └── app/              # Next.js App Router (UI & Pages)
│   ├── package.json          # Independent frontend dependencies & scripts
│   └── tsconfig.json
│
├── backend/                  # Independent API, AI Agents & Business Logic service
│   ├── src/
│   │   ├── api/              # HTTP REST routes, controllers & middleware
│   │   ├── agents/           # Specialized AI agents (validation, fraud, loss)
│   │   ├── orchestration/    # Multi-agent workflows & consensus engine
│   │   ├── rag/              # Knowledge retrieval, policy vector stores & embeddings
│   │   ├── document-processing/ # Multimodal OCR, document parsing & ingestion
│   │   ├── claims/           # Claim assessment rules & lifecycle management
│   │   └── index.ts          # Server entry point
│   ├── package.json          # Independent backend dependencies & scripts
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md                 # System architecture documentation
```

### Architectural Principles & Boundaries

1. **Strict Separation of Concerns**:
   - `/frontend` is exclusively responsible for presentation, user interfaces, claim submission dashboards, interactive visualizations, and user experience.
   - `/backend` contains all computational logic, business rules, document extraction/OCR, RAG pipelines, AI agent swarms, and claim assessment decisions.
2. **No Monolithic Leaks**:
   - Backend AI logic, vector stores, and orchestration are **strictly prohibited** from living inside the Next.js application.
   - The Next.js frontend communicates with the backend **solely over standard HTTP APIs**.
3. **Independent Lifecycles**:
   - Each application maintains its own `package.json`, dependencies, configuration, and build artifacts.
   - Either application can be developed, tested, deployed, and scaled independently without coupling.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+)

---

### Running the Backend

The backend runs an Express + TypeScript API server exposing health checks and intelligence endpoints.

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Default backend address: `http://localhost:5000`

---

### Running the Frontend

The frontend runs a Next.js application using App Router and TypeScript.

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Default frontend address: `http://localhost:3000`

---

## 🔌 API Communication

The frontend interacts with the backend over HTTP. During local development:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Backend health and availability check |
| `/api/status` | `GET` | Backend intelligence modules and services status |

---

## 🛡️ License
Proprietary / Internal - AI Insurance Claims Intelligence Project
