-- Migration: 004_user_policies.sql
-- Description: User policies and policy products with RLS

CREATE TABLE IF NOT EXISTS user_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurer_name TEXT NOT NULL DEFAULT 'InsuredYou',
  policy_name TEXT NOT NULL,
  policy_type claim_type NOT NULL DEFAULT 'AUTO',
  policyholder_name TEXT NOT NULL,
  insured_asset TEXT,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  premium NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deductible NUMERIC(10, 2) NOT NULL DEFAULT 500,
  coverage TEXT[] NOT NULL DEFAULT '{}',
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  limits TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  document_id UUID REFERENCES claim_documents(id) ON DELETE SET NULL,
  extracted_metadata JSONB,
  evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_policies_user_id ON user_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_policies_policy_number ON user_policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_user_policies_status ON user_policies(status);

-- RLS
ALTER TABLE user_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policies"
  ON user_policies FOR SELECT
  USING (user_id = auth.uid() OR is_claims_staff());

CREATE POLICY "Users can insert own policies"
  ON user_policies FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_claims_staff());

CREATE POLICY "Users can update own policies"
  ON user_policies FOR UPDATE
  USING (user_id = auth.uid() OR is_claims_staff());

-- Seed default profiles for testing
INSERT INTO profiles (id, email, full_name, role)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'claimant@example.com', 'Alice Claimant', 'CLAIMANT'),
  ('11111111-0000-0000-0000-000000000002', 'other_claimant@example.com', 'Bob Claimant', 'CLAIMANT'),
  ('22222222-0000-0000-0000-000000000002', 'officer@example.com', 'Charlie Officer', 'CLAIMS_OFFICER'),
  ('33333333-0000-0000-0000-000000000003', 'investigator@example.com', 'Dana Investigator', 'INVESTIGATOR'),
  ('44444444-0000-0000-0000-000000000004', 'admin@example.com', 'Evan Admin', 'ADMIN')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Seed sample user policies for testing
INSERT INTO user_policies (
  id,
  user_id,
  policy_number,
  insurer_name,
  policy_name,
  policy_type,
  policyholder_name,
  insured_asset,
  start_date,
  expiry_date,
  premium,
  deductible,
  coverage,
  exclusions,
  limits,
  status
)
VALUES 
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-0000-0000-0000-000000000001',
    'POL-AUTO-2026-001',
    'InsuredYou Mutual',
    'Comprehensive Motorist Shield',
    'AUTO',
    'Alice Claimant',
    '2023 Tesla Model 3 (VIN: 5YJ3E1EB9PF123456)',
    '2026-01-01',
    '2026-12-31',
    1850.00,
    500.00,
    ARRAY['Collision Damage up to $50,000', 'Comprehensive Fire & Theft', 'Uninsured Motorist Protection', '24/7 Roadside Assistance'],
    ARRAY['Intentional damage or racing', 'Normal wear and tear', 'Hit-and-run without police report within 48h'],
    ARRAY['Vehicle Actual Cash Value max $50,000', 'Medical Payments $10,000 per person'],
    'ACTIVE'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-0000-0000-0000-000000000001',
    'POL-PROP-2026-002',
    'InsuredYou Home Guard',
    'Homeowners Dwelling & Asset Protection',
    'PROPERTY',
    'Alice Claimant',
    'Residential Property — 742 Evergreen Terrace',
    '2026-01-01',
    '2026-12-31',
    2400.00,
    1000.00,
    ARRAY['Dwelling structural damage up to $500,000', 'Personal property contents up to $100,000', 'Sudden plumbing discharge'],
    ARRAY['Flooding and storm surge (requires flood endorsement)', 'Gradual seepage exceeding 14 days', 'Earthquake damage'],
    ARRAY['Dwelling: $500,000', 'Personal property: $100,000', 'Loss of use: $50,000'],
    'ACTIVE'
  )
ON CONFLICT (id) DO NOTHING;
