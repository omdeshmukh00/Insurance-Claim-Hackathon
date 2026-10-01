export interface NewClaimFormData {
  // Step 1 – Claim Information
  claimantName: string;
  policyNumber: string;
  claimType: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  estimatedAmount: string;
  // Step 2 – Evidence
  files: File[];
  // Meta
  submittedAt?: string;
}
