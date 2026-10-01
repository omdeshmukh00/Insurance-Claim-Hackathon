-- Migration: 002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for tenant isolation and role-based data access

-- Helper function to check current user's role from profiles
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if current user is staff (claims officer, investigator, admin)
CREATE OR REPLACE FUNCTION is_claims_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND role IN ('CLAIMS_OFFICER', 'INVESTIGATOR', 'ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PROFILES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_claims_staff());

CREATE POLICY "Users can update own non-role fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- prevents changing role
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- 2. CLAIMS RLS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants can view own claims"
  ON claims FOR SELECT
  USING (claimant_id = auth.uid() OR is_claims_staff());

CREATE POLICY "Claimants can insert own claims"
  ON claims FOR INSERT
  WITH CHECK (claimant_id = auth.uid());

CREATE POLICY "Claimants can update own unreviewed claims"
  ON claims FOR UPDATE
  USING (
    claimant_id = auth.uid() 
    AND status IN ('SUBMITTED', 'REQUIRES_INFO')
  );

CREATE POLICY "Staff can update claims"
  ON claims FOR UPDATE
  USING (is_claims_staff());

-- 3. CLAIM DOCUMENTS RLS
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View documents if claim accessible"
  ON claim_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = claim_documents.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

CREATE POLICY "Upload documents if claim owner or staff"
  ON claim_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = claim_documents.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 4. EVIDENCE RLS
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read evidence if claim accessible"
  ON evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = evidence.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 5. AGENT FINDINGS RLS
ALTER TABLE agent_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read findings if claim accessible"
  ON agent_findings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = agent_findings.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 6. MISSING INFORMATION RLS
ALTER TABLE missing_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read missing info if claim accessible"
  ON missing_information FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = missing_information.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 7. ASSESSMENTS RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read assessment if claim accessible"
  ON assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = assessments.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 8. REVIEW DECISIONS RLS
ALTER TABLE review_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read review decisions if claim accessible"
  ON review_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = review_decisions.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

CREATE POLICY "Only staff can insert review decisions"
  ON review_decisions FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    is_claims_staff()
  );

-- 9. SETTLEMENTS RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read settlements if claim accessible"
  ON settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = settlements.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

CREATE POLICY "Only claims officers and admins can create/update settlements"
  ON settlements FOR ALL
  USING (
    current_user_role() IN ('CLAIMS_OFFICER', 'ADMIN')
  );

-- 10. CLAIM EVENTS RLS
ALTER TABLE claim_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read claim events if claim accessible"
  ON claim_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = claim_events.claim_id 
        AND (claims.claimant_id = auth.uid() OR is_claims_staff())
    )
  );

-- 11. AUDIT LOGS RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only staff and admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (is_claims_staff());
