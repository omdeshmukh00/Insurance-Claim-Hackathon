import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "primary"
  | "action"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default:  "bg-[var(--bg-subtle)]  text-[var(--text-secondary)]  border-[var(--border-default)]",
    primary:  "bg-[var(--green-50)]   text-[var(--green-700)]       border-[var(--green-200)]",
    action:   "bg-[var(--amber-50)]   text-[var(--amber-700)]       border-[var(--amber-200)]",
    success:  "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--green-200)]",
    warning:  "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--amber-200)]",
    error:    "bg-[var(--color-error-light)]   text-[var(--color-error-dark)]   border-red-200",
    info:     "bg-[var(--color-info-light)]    text-[var(--color-info-dark)]    border-blue-200",
    outline:  "bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-[var(--text-muted)]",
    primary: "bg-[var(--green-600)]",
    action:  "bg-[var(--amber-500)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    error:   "bg-[var(--color-error)]",
    info:    "bg-[var(--color-info)]",
    outline: "bg-[var(--text-muted)]",
  };

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        "whitespace-nowrap transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("rounded-full shrink-0", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
