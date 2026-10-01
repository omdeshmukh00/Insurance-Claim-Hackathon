-- Migration: 001_initial_schema.sql
-- Description: Create core schema, enums, tables, foreign keys, and indexes for Insurance Claims AI

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safe attempt to enable pgvector if available in environment
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector extension not available; falling back to standard text search';
END $$;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CLAIMANT', 'CLAIMS_OFFICER', 'INVESTIGATOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM (
    'SUBMITTED',
    'PROCESSING',
    'UNDER_INVESTIGATION',
    'REQUIRES_INFO',
    'UNDER_REVIEW',
    'APPROVED',
    'SETTLED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE claim_type AS ENUM ('AUTO', 'HEALTH', 'PROPERTY', 'LIFE', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE claim_complexity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE agent_type AS ENUM (
    'DOCUMENT',
    'POLICY_RAG',
    'COVERAGE',
    'ANOMALY',
    'MISSING_INFO',
    'ASSESSMENT',
    'SETTLEMENT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE finding_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE review_decision_type AS ENUM (
    'APPROVE_FOR_PROCESSING',
    'REQUEST_INFORMATION',
    'ESCALATE',
    'REJECT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE settlement_status AS ENUM (
    'PENDING',
    'APPROVED',
    'PROCESSED',
    'PAID',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM ('USER', 'AI_AGENT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE evidence_type AS ENUM (
    'DOCUMENT_EXTRACT',
    'POLICY_CLAUSE',
    'HISTORICAL_CLAIM',
    'METADATA_DISCREPANCY'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE coverage_status AS ENUM (
    'COVERED',
    'POTENTIALLY_COVERED',
    'NOT_CLEARLY_COVERED',
    'NOT_COVERED',
    'REQUIRES_REVIEW'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (name, description)
VALUES 
  ('CLAIMANT', 'Submits insurance claims and uploads evidence'),
  ('CLAIMS_OFFICER', 'Assesses coverage, reviews AI findings, and approves settlements'),
  ('INVESTIGATOR', 'Investigates anomalies, inconsistencies, and complex claims'),
  ('ADMIN', 'System administrator with complete access')
ON CONFLICT (name) DO NOTHING;

-- 2. Profiles table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'CLAIMANT',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  claim_number TEXT UNIQUE NOT NULL,
  policy_number TEXT NOT NULL,
  claim_type claim_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  claim_amount NUMERIC(12, 2) NOT NULL CHECK (claim_amount >= 0),
  status claim_status NOT NULL DEFAULT 'SUBMITTED',
  complexity claim_complexity,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  assigned_officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Claim Documents
CREATE TABLE IF NOT EXISTS claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  document_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  processing_status TEXT NOT NULL DEFAULT 'PENDING',
  extracted_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Policy Documents
CREATE TABLE IF NOT EXISTS policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number TEXT NOT NULL,
  title TEXT NOT NULL,
  policy_type claim_type NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NOT NULL,
  file_name TEXT,
  storage_path TEXT,
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Policy Chunks (for RAG)
CREATE TABLE IF NOT EXISTS policy_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_document_id UUID NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  page_number INT,
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Agent Runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  agent_type agent_type NOT NULL,
  status agent_status NOT NULL DEFAULT 'PENDING',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  document_id UUID REFERENCES claim_documents(id) ON DELETE SET NULL,
  page_number INT,
  source_text TEXT NOT NULL,
  evidence_type evidence_type NOT NULL DEFAULT 'DOCUMENT_EXTRACT',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Agent Findings
CREATE TABLE IF NOT EXISTS agent_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity finding_severity NOT NULL DEFAULT 'LOW',
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Missing Information
CREATE TABLE IF NOT EXISTS missing_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  required_item TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority finding_severity NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  context_evidence_ids UUID[] NOT NULL DEFAULT '{}',
  resolved_document_id UUID REFERENCES claim_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  complexity claim_complexity NOT NULL DEFAULT 'MEDIUM',
  coverage_status coverage_status NOT NULL,
  coverage_summary TEXT NOT NULL,
  anomaly_summary TEXT NOT NULL,
  missing_info_summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Review Decisions
CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  decision review_decision_type NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Settlements
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  settlement_amount NUMERIC(12, 2) NOT NULL CHECK (settlement_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status settlement_status NOT NULL DEFAULT 'PENDING',
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  payment_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Claim Events (Timeline)
CREATE TABLE IF NOT EXISTS claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_type actor_type NOT NULL DEFAULT 'SYSTEM',
  actor TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type actor_type NOT NULL DEFAULT 'SYSTEM',
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_policy_chunks_policy_id ON policy_chunks(policy_document_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_claim_id ON agent_runs(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_claim_id ON evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_agent_findings_claim_id ON agent_findings(claim_id);
CREATE INDEX IF NOT EXISTS idx_missing_info_claim_id ON missing_information(claim_id);
CREATE INDEX IF NOT EXISTS idx_assessments_claim_id ON assessments(claim_id);
CREATE INDEX IF NOT EXISTS idx_review_decisions_claim_id ON review_decisions(claim_id);
CREATE INDEX IF NOT EXISTS idx_settlements_claim_id ON settlements(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_claim_id ON claim_events(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
