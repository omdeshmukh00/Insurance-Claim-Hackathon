export type ReviewDecision =
  | "approve"
  | "reject"
  | "request_more_info"
  | "escalate_to_siu";

export interface ClaimReview {
  id: string;
  claimId: string;
  reviewerId: string;
  reviewerName: string;
  decision: ReviewDecision;
  decisionNotes: string;
  adjustedPayout?: number;
  reviewedAt: string;
}
