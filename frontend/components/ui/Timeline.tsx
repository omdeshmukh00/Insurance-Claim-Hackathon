import React from "react";
import { cn } from "@/lib/utils";

export type TimelineItemStatus = "completed" | "active" | "pending" | "error";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: TimelineItemStatus;
  icon?: React.ReactNode;
  meta?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusStyles: Record<TimelineItemStatus, { dot: string; ring: string; connector: string }> = {
  completed: {
    dot:       "bg-[var(--green-600)] border-[var(--green-600)]",
    ring:      "shadow-[0_0_0_3px_var(--green-100)]",
    connector: "bg-[var(--green-200)]",
  },
  active: {
    dot:       "bg-[var(--amber-500)] border-[var(--amber-500)]",
    ring:      "shadow-[0_0_0_3px_var(--amber-100)]",
    connector: "bg-[var(--border-default)]",
  },
  pending: {
    dot:       "bg-[var(--bg-card)] border-[var(--border-strong)]",
    ring:      "",
    connector: "bg-[var(--border-default)]",
  },
  error: {
    dot:       "bg-[var(--color-error)] border-[var(--color-error)]",
    ring:      "shadow-[0_0_0_3px_var(--color-error-light)]",
    connector: "bg-[var(--border-default)]",
  },
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      {items.map((item, idx) => {
        const cfg = statusStyles[item.status];
        const isLast = idx === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[13px] top-7 bottom-0 w-0.5",
                  cfg.connector
                )}
              />
            )}

            {/* Dot */}
            <div className="shrink-0 mt-1 relative z-10">
              {item.icon ? (
                <div
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-full border-2",
                    cfg.dot, cfg.ring,
                    "text-white [&>svg]:h-3.5 [&>svg]:w-3.5"
                  )}
                >
                  {item.icon}
                </div>
              ) : (
                <div
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-full border-2",
                    cfg.dot, cfg.ring
                  )}
                >
                  {item.status === "completed" && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white fill-current">
                      <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.42 1.44l3 3a1 1 0 001.42 0l7-7a1 1 0 00-1.44-1.44z" />
                    </svg>
                  )}
                  {item.status === "active" && (
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                  {item.status === "error" && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white fill-current">
                      <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 8.5h-1v-1h1v1zm0-2h-1v-4h1v4z" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      item.status === "pending"
                        ? "text-[var(--text-tertiary)]"
                        : "text-[var(--text-primary)]"
                    )}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.meta && (
                    <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-1">
                      {item.meta}
                    </p>
                  )}
                </div>
                {item.timestamp && (
                  <span className="shrink-0 text-[10px] text-[var(--text-muted)] font-medium tabular-nums">
                    {item.timestamp}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
