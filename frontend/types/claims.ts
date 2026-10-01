export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_investigation"
  | "assessment_pending"
  | "review_required"
  | "approved"
  | "rejected"
  | "escalated";

export type ClaimType =
  | "auto_collision"
  | "property_damage"
  | "health_injury"
  | "commercial_liability"
  | "theft_loss";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface PolicyHolder {
  id: string;
  name: string;
  policyNumber: string;
  policyType: string;
  coverageLimit: number;
  deductible: number;
  effectiveDate: string;
  expiryDate: string;
}

export interface Claim {
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
  createdAt: string;
  updatedAt: string;
}
