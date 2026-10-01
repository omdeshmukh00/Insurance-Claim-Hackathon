import type { ClaimStatus, ClaimType, PriorityLevel } from "./claims";

// ─── Extended Claim type for Phase 4 ───────────────────────────────────────
export interface PolicyHolder {
  id: string;
  name: string;
  policyNumber: string;
  policyType: string;
  coverageLimit: number;
  deductible: number;
  effectiveDate: string;
  expiryDate: string;
  email: string;
  phone: string;
  address: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: "photo" | "police_report" | "repair_estimate" | "medical_record" | "other";
  uploadedAt: string;
  ocrProcessed: boolean;
  extractedText?: string;
}

export interface AnomalyFlag {
  id: string;
  type: "date_inconsistency" | "location_mismatch" | "prior_claim" | "policy_lapse" | "fraud_indicator" | "excessive_amount";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedBy: string;
  detectedAt: string;
  resolved: boolean;
}

export interface MissingInfo {
  id: string;
  field: string;
  description: string;
  required: boolean;
  requestedAt: string;
  resolvedAt?: string;
}

export interface CoverageSummary {
  policyNumber: string;
  policyType: string;
  coverageLimit: number;
  deductible: number;
  isActive: boolean;
  expiryDate: string;
  coveredPerils: string[];
  exclusions: string[];
  priorClaims: number;
}

export interface ClaimDetail {
  id: string;
  claimNumber: string;
  policyHolder: PolicyHolder;
  type: ClaimType;
  status: ClaimStatus;
  priority: PriorityLevel;
  incidentDate: string;
  filingDate: string;
  incidentLocation: string;
  description: string;
  estimatedLoss: number;
  approvedPayout?: number;
  fraudRiskScore?: number;
  assignedAdjuster?: string;
  aiRecommendation?: "auto_approve" | "manual_review" | "reject" | "further_investigation";
  aiConfidence?: number;
  documents: ClaimDocument[];
  anomalies: AnomalyFlag[];
  missingInfo: MissingInfo[];
  coverage: CoverageSummary;
  createdAt: string;
  updatedAt: string;
  timeline: ClaimTimelineEvent[];
}

export interface ClaimTimelineEvent {
  id: string;
  title: string;
  description?: string;
  actor: string;
  status: "completed" | "active" | "pending" | "error";
  timestamp: string;
}

// ClaimStatus, ClaimType, PriorityLevel are exported from claims.ts
