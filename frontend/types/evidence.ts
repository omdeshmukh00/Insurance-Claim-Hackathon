export type EvidenceType =
  | "damage_photo"
  | "police_report"
  | "repair_estimate"
  | "medical_record"
  | "telematics_log"
  | "witness_statement";

export interface EvidenceDocument {
  id: string;
  claimId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  evidenceType: EvidenceType;
  uploadedAt: string;
  ocrProcessed?: boolean;
  extractedText?: string;
  metadata?: Record<string, unknown>;
}
