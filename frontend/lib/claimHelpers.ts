import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Display helpers ────────────────────────────────────────────────────────

export const CLAIM_TYPE_LABELS: Record<string, string> = {
  auto_collision: "Auto Collision",
  AUTO: "Auto Collision",
  property_damage: "Property Damage",
  PROPERTY: "Property Damage",
  health_injury: "Health / Injury",
  HEALTH: "Health / Injury",
  commercial_liability: "Commercial Liability",
  theft_loss: "Theft / Loss",
  LIFE: "Life Insurance",
  GENERAL: "General Claim",
};

export const AI_RECOMMENDATION_LABELS: Record<string, string> = {
  auto_approve: "Auto-Approve",
  automated_processing: "Automated Processing",
  manual_review: "Manual Review",
  human_review: "Human Review",
  reject: "Reject",
  further_investigation: "Further Investigation",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  LOW: "Low",
  medium: "Medium",
  MEDIUM: "Medium",
  high: "High",
  HIGH: "High",
  critical: "Critical",
  CRITICAL: "Critical",
};

export function priorityVariant(p: string | undefined): BadgeVariant {
  if (!p) return "default";
  const key = p.toLowerCase();
  const map: Record<string, BadgeVariant> = {
    low: "default",
    medium: "info",
    high: "warning",
    critical: "error",
  };
  return map[key] || "default";
}

export function aiRecommendationVariant(rec: string | undefined): BadgeVariant {
  if (!rec) return "default";
  const key = rec.toLowerCase();
  if (key.includes("approve") || key.includes("automated")) return "success";
  if (key.includes("review") || key.includes("manual")) return "warning";
  if (key.includes("reject")) return "error";
  if (key.includes("investigat")) return "info";
  return "default";
}

export function fraudScoreColor(score: number | undefined): string {
  if (score === undefined || score === null) return "var(--text-muted)";
  if (score < 25) return "var(--color-success)";
  if (score < 60) return "var(--color-warning)";
  return "var(--color-error)";
}

export const CLAIM_TYPE_OPTIONS = [
  { value: "AUTO", label: "Auto Collision" },
  { value: "PROPERTY", label: "Property Damage" },
  { value: "HEALTH", label: "Health / Injury" },
  { value: "LIFE", label: "Life Insurance" },
  { value: "GENERAL", label: "General Claim" },
];

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "PROCESSING", label: "Processing" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "REQUIRES_INFO", label: "Requires Info" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "SETTLED", label: "Settled" },
  { value: "REJECTED", label: "Rejected" },
];
