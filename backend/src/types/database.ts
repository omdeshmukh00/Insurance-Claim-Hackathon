export type UserRole = 'CLAIMANT' | 'CLAIMS_OFFICER' | 'INVESTIGATOR' | 'ADMIN';

export type ClaimStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'UNDER_INVESTIGATION'
  | 'REQUIRES_INFO'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'SETTLED'
  | 'REJECTED';

export type ClaimType = 'AUTO' | 'HEALTH' | 'PROPERTY' | 'LIFE' | 'GENERAL';

export type ClaimComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export type AgentType =
  | 'DOCUMENT'
  | 'POLICY_RAG'
  | 'COVERAGE'
  | 'ANOMALY'
  | 'MISSING_INFO'
  | 'ASSESSMENT'
  | 'SETTLEMENT';

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReviewDecisionType =
  | 'APPROVE_FOR_PROCESSING'
  | 'REQUEST_INFORMATION'
  | 'ESCALATE'
  | 'REJECT';

export type SettlementStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'PAID' | 'CANCELLED';

export type ActorType = 'USER' | 'AI_AGENT' | 'SYSTEM';

export type EvidenceType =
  | 'DOCUMENT_EXTRACT'
  | 'POLICY_CLAUSE'
  | 'HISTORICAL_CLAIM'
  | 'METADATA_DISCREPANCY';

export type CoverageStatus =
  | 'COVERED'
  | 'POTENTIALLY_COVERED'
  | 'NOT_CLEARLY_COVERED'
  | 'NOT_COVERED'
  | 'REQUIRES_REVIEW';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  claimant_id: string;
  claim_number: string;
  policy_number: string;
  claim_type: ClaimType;
  title: string;
  description: string;
  incident_date: string;
  claim_amount: number;
  status: ClaimStatus;
  complexity?: ClaimComplexity | null;
  requires_human_review: boolean;
  assigned_officer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  document_type: string;
  uploaded_by: string;
  processing_status: string;
  extracted_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyDocument {
  id: string;
  policy_number: string;
  title: string;
  policy_type: ClaimType;
  effective_from: string;
  effective_to: string;
  file_name?: string | null;
  storage_path?: string | null;
  raw_content?: string | null;
  created_at: string;
  updated_at: string;
}

export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface UserPolicy {
  id: string;
  user_id: string;
  policy_number: string;
  insurer_name: string;
  policy_name: string;
  policy_type: ClaimType;
  policyholder_name: string;
  insured_asset?: string | null;
  start_date: string;
  expiry_date: string;
  premium: number;
  deductible: number;
  coverage: string[];
  exclusions: string[];
  limits: string[];
  status: PolicyStatus;
  document_id?: string | null;
  extracted_metadata?: Record<string, any> | null;
  evidence?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyChunk {
  id: string;
  policy_document_id: string;
  section_title: string;
  page_number?: number | null;
  chunk_text: string;
  chunk_index: number;
  embedding?: number[] | null;
  created_at: string;
}

export interface AgentRun {
  id: string;
  claim_id: string;
  agent_type: AgentType;
  status: AgentStatus;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  execution_time_ms?: number | null;
  created_at: string;
}

export interface Evidence {
  id: string;
  claim_id: string;
  agent_run_id?: string | null;
  document_id?: string | null;
  page_number?: number | null;
  source_text: string;
  evidence_type: EvidenceType;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface AgentFinding {
  id: string;
  claim_id: string;
  agent_run_id?: string | null;
  finding_type: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  evidence_ids: string[];
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface MissingInformation {
  id: string;
  claim_id: string;
  required_item: string;
  reason: string;
  priority: FindingSeverity;
  status: string;
  context_evidence_ids: string[];
  resolved_document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  claim_id: string;
  complexity: ClaimComplexity;
  coverage_status: CoverageStatus;
  coverage_summary: string;
  anomaly_summary: string;
  missing_info_summary: string;
  recommendation: 'automated_processing' | 'human_review';
  reasons: string[];
  evidence_ids: string[];
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewDecision {
  id: string;
  claim_id: string;
  reviewer_id: string;
  decision: ReviewDecisionType;
  notes: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  claim_id: string;
  settlement_amount: number;
  currency: string;
  status: SettlementStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  reason: string;
  evidence_ids: string[];
  payment_reference?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimEvent {
  id: string;
  claim_id: string;
  type: string;
  actor_type: ActorType;
  actor: string;
  status: string;
  message: string;
  metadata?: Record<string, any> | null;
  timestamp: string;
}

export interface EmailLog {
  id: string;
  claim_id?: string | null;
  recipient: string;
  subject: string;
  template: string;
  status: string;
  provider_message_id?: string | null;
  error?: string | null;
  sent_at: string;
}

export interface AuditLog {
  id: string;
  actor_type: ActorType;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, any> | null;
  timestamp: string;
}
