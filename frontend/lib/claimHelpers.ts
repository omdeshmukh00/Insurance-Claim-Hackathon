import type { ClaimType, ClaimStatus, PriorityLevel } from "@/types/claims";
import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Display helpers ────────────────────────────────────────────────────────

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  auto_collision:        "Auto Collision",
  property_damage:       "Property Damage",
  health_injury:         "Health / Injury",
  commercial_liability:  "Commercial Liability",
  theft_loss:            "Theft / Loss",
};

export const AI_RECOMMENDATION_LABELS: Record<string, string> = {
  auto_approve:           "Auto-Approve",
  manual_review:          "Manual Review",
  reject:                 "Reject",
  further_investigation:  "Further Investigation",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

export function priorityVariant(p: PriorityLevel): BadgeVariant {
  const map: Record<PriorityLevel, BadgeVariant> = { low: "default", medium: "info", high: "warning", critical: "error" };
  return map[p];
}

export function aiRecommendationVariant(rec: string | undefined): BadgeVariant {
  if (!rec) return "default";
  return {
    auto_approve:          "success",
    manual_review:         "warning",
    reject:                "error",
    further_investigation: "info",
  }[rec] as BadgeVariant ?? "default";
}

export function fraudScoreColor(score: number | undefined): string {
  if (!score) return "var(--text-muted)";
  if (score < 20) return "var(--color-success)";
  if (score < 50) return "var(--color-warning)";
  return "var(--color-error)";
}

export const CLAIM_TYPE_OPTIONS = Object.entries(CLAIM_TYPE_LABELS).map(([value, label]) => ({ value, label }));
export const STATUS_OPTIONS: { value: ClaimStatus | "all"; label: string }[] = [
  { value: "all",                 label: "All Statuses" },
  { value: "draft",               label: "Draft" },
  { value: "submitted",           label: "Submitted" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "assessment_pending",  label: "Assessment Pending" },
  { value: "review_required",     label: "Review Required" },
  { value: "approved",            label: "Approved" },
  { value: "rejected",            label: "Rejected" },
  { value: "escalated",           label: "Escalated" },
];
