export interface LossLineItem {
  id: string;
  category: "parts" | "labor" | "materials" | "medical" | "towing" | "other";
  description: string;
  claimedAmount: number;
  assessedAmount: number;
  isCovered: boolean;
  notes?: string;
}

export interface ClaimAssessment {
  id: string;
  claimId: string;
  totalClaimed: number;
  totalAssessed: number;
  deductibleApplied: number;
  netPayoutRecommended: number;
  policyLimitReached: boolean;
  lineItems: LossLineItem[];
  assessmentDate: string;
}
