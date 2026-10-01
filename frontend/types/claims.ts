// Core claim domain types — used by both legacy and Phase 4 ClaimDetail.
// Note: PolicyHolder is defined in claimDetail.ts (extended version).

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
