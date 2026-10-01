"use client";
import React from "react";
import * as RadixProgress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressProps {
  /** Value 0–100 */
  value: number;
  /** Track label */
  label?: string;
  /** Show percentage */
  showValue?: boolean;
  /** Colour variant */
  variant?: "primary" | "action" | "success" | "warning" | "error";
  /** Bar size */
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Animate the fill */
  animated?: boolean;
}

export function Progress({
  value,
  label,
  showValue = false,
  variant = "primary",
  size = "sm",
  className,
  animated = false,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const trackColors = {
    primary: "bg-[var(--green-100)]",
    action:  "bg-[var(--amber-100)]",
    success: "bg-[var(--green-100)]",
    warning: "bg-[var(--amber-100)]",
    error:   "bg-red-100",
  };
  const fillColors = {
    primary: "bg-[var(--green-600)]",
    action:  "bg-[var(--amber-500)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    error:   "bg-[var(--color-error)]",
  };
  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <RadixProgress.Root
        value={clamped}
        className={cn(
          "w-full overflow-hidden rounded-full",
          trackColors[variant],
          heights[size]
        )}
      >
        <RadixProgress.Indicator
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            fillColors[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${clamped}%` }}
        />
      </RadixProgress.Root>
    </div>
  );
}

/* ── Segmented progress (multiple fills) ── */
export interface SegmentedProgressProps {
  segments: { value: number; color: string; label: string }[];
  className?: string;
}
export function SegmentedProgress({ segments, className }: SegmentedProgressProps) {
  return (
    <div className={cn("flex gap-0.5 h-2 w-full rounded-full overflow-hidden", className)}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn("h-full transition-all duration-500", seg.color)}
          style={{ width: `${seg.value}%` }}
          title={`${seg.label}: ${seg.value}%`}
        />
      ))}
    </div>
  );
}
