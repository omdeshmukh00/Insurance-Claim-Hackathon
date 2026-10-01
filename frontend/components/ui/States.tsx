import React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./Button";

/* ── EmptyState ── */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {icon && (
        <div className="mb-4 p-4 rounded-[var(--radius-2xl)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
          <div className="[&>svg]:h-8 [&>svg]:w-8">{icon}</div>
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mt-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-tertiary)] mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryAction && (
            <Button variant="secondary" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button variant={action.variant ?? "primary"} size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── LoadingState ── */
export interface LoadingStateProps {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "spinner" | "dots" | "skeleton";
}
export function LoadingState({
  label = "Loading…",
  description,
  size = "md",
  className,
  variant = "spinner",
}: LoadingStateProps) {
  const spinnerSizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 px-6", className)}>
      {variant === "spinner" && (
        <div
          className={cn(
            "rounded-full border-[3px] border-[var(--green-100)] border-t-[var(--green-600)] animate-spin",
            spinnerSizes[size]
          )}
        />
      )}
      {variant === "dots" && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--green-500)] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
      {variant === "skeleton" && (
        <div className="w-full max-w-xs space-y-3">
          <div className="skeleton h-4 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-full  rounded-full" />
          <div className="skeleton h-3 w-5/6  rounded-full" />
        </div>
      )}
      {label && (
        <div className="text-center space-y-0.5">
          <p className={cn("font-medium text-[var(--text-secondary)]", textSizes[size])}>{label}</p>
          {description && (
            <p className={cn("text-[var(--text-tertiary)]", size === "lg" ? "text-sm" : "text-xs")}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
