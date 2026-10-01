import React from "react";
import { cn } from "@/lib/utils";
import type { ClaimStatus } from "@/types/claims";

export type StatusValue =
  | ClaimStatus
  | "online"
  | "offline"
  | "running"
  | "pending"
  | "completed"
  | "failed"
  | "flagged"
  | "processing"
  | "escalated"
  | string;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusValue;
  size?: "sm" | "md";
  /** Show animated pulse dot */
  animate?: boolean;
}

const statusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  /* Claim statuses */
  draft:                { label: "Draft",           dot: "bg-[var(--text-muted)]",    pill: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]" },
  submitted:            { label: "Submitted",       dot: "bg-[var(--color-info)]",    pill: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-blue-200" },
  under_investigation:  { label: "Investigating",   dot: "bg-[var(--amber-500)]",     pill: "bg-[var(--amber-50)] text-[var(--amber-700)] border-[var(--amber-200)]" },
  assessment_pending:   { label: "Assessing",       dot: "bg-[var(--amber-500)]",     pill: "bg-[var(--amber-50)] text-[var(--amber-700)] border-[var(--amber-200)]" },
  review_required:      { label: "Needs Review",    dot: "bg-[var(--amber-600)]",     pill: "bg-[var(--amber-50)] text-[var(--amber-800)] border-[var(--amber-300)]" },
  approved:             { label: "Approved",        dot: "bg-[var(--color-success)]", pill: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--green-200)]" },
  rejected:             { label: "Rejected",        dot: "bg-[var(--color-error)]",   pill: "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-red-200" },
  escalated:            { label: "Escalated",       dot: "bg-red-600",                pill: "bg-red-50 text-red-800 border-red-200" },
  /* System / Agent statuses */
  online:               { label: "Online",          dot: "bg-[var(--color-success)]", pill: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--green-200)]" },
  offline:              { label: "Offline",         dot: "bg-[var(--text-muted)]",    pill: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]" },
  running:              { label: "Running",         dot: "bg-[var(--color-info)]",    pill: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-blue-200" },
  pending:              { label: "Pending",         dot: "bg-[var(--text-muted)]",    pill: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]" },
  completed:            { label: "Completed",       dot: "bg-[var(--color-success)]", pill: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--green-200)]" },
  failed:               { label: "Failed",          dot: "bg-[var(--color-error)]",   pill: "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-red-200" },
  flagged:              { label: "Flagged",         dot: "bg-[var(--color-warning)]", pill: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--amber-200)]" },
  processing:           { label: "Processing",      dot: "bg-[var(--color-info)]",    pill: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-blue-200" },
};

const liveStatuses = new Set(["running", "under_investigation", "assessment_pending", "processing", "online"]);

export function StatusBadge({ status, size = "md", animate, className, ...props }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? {
    label: status.replace(/_/g, " "),
    dot: "bg-[var(--text-muted)]",
    pill: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]",
  };

  const shouldAnimate = animate ?? liveStatuses.has(status);

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
  };
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full capitalize",
        cfg.pill,
        sizes[size],
        className
      )}
      {...props}
    >
      <span className={cn("rounded-full shrink-0 relative", dotSize)}>
        <span className={cn("absolute inset-0 rounded-full", cfg.dot)} />
        {shouldAnimate && (
          <span className={cn("absolute inset-0 rounded-full animate-ping opacity-60", cfg.dot)} />
        )}
      </span>
      {cfg.label}
    </span>
  );
}
