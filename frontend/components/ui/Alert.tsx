import React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const alertConfig: Record<AlertVariant, { bg: string; border: string; icon: React.ElementType; iconColor: string; titleColor: string; descColor: string }> = {
  info: {
    bg:         "bg-[var(--color-info-light)]",
    border:     "border-blue-200",
    icon:       Info,
    iconColor:  "text-[var(--color-info)]",
    titleColor: "text-[var(--color-info-dark)]",
    descColor:  "text-blue-700",
  },
  success: {
    bg:         "bg-[var(--color-success-light)]",
    border:     "border-[var(--green-200)]",
    icon:       CheckCircle2,
    iconColor:  "text-[var(--color-success)]",
    titleColor: "text-[var(--color-success-dark)]",
    descColor:  "text-[var(--green-700)]",
  },
  warning: {
    bg:         "bg-[var(--color-warning-light)]",
    border:     "border-[var(--amber-200)]",
    icon:       TriangleAlert,
    iconColor:  "text-[var(--color-warning)]",
    titleColor: "text-[var(--color-warning-dark)]",
    descColor:  "text-[var(--amber-700)]",
  },
  error: {
    bg:         "bg-[var(--color-error-light)]",
    border:     "border-red-200",
    icon:       AlertCircle,
    iconColor:  "text-[var(--color-error)]",
    titleColor: "text-[var(--color-error-dark)]",
    descColor:  "text-red-700",
  },
};

export function Alert({
  variant = "info",
  title,
  description,
  onDismiss,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const cfg = alertConfig[variant];
  const IconComp = cfg.icon;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 p-4 rounded-[var(--radius-lg)] border",
        cfg.bg, cfg.border,
        className
      )}
      {...props}
    >
      <div className={cn("shrink-0 mt-0.5 [&>svg]:h-4 [&>svg]:w-4", cfg.iconColor)}>
        {icon ?? <IconComp />}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        {title && (
          <p className={cn("text-sm font-semibold", cfg.titleColor)}>{title}</p>
        )}
        {description && (
          <p className={cn("text-sm", cfg.descColor)}>{description}</p>
        )}
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "shrink-0 rounded-[var(--radius-sm)] p-0.5 transition-opacity",
            "opacity-60 hover:opacity-100",
            cfg.iconColor
          )}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Inline Banner (full-width) ── */
export function AlertBanner({
  variant = "info",
  title,
  description,
  onDismiss,
  className,
}: AlertProps) {
  const cfg = alertConfig[variant];
  const IconComp = cfg.icon;

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 border-b", cfg.bg, cfg.border, className)}>
      <IconComp className={cn("h-4 w-4 shrink-0", cfg.iconColor)} />
      <div className="flex-1">
        {title && <span className={cn("text-sm font-semibold mr-2", cfg.titleColor)}>{title}</span>}
        {description && <span className={cn("text-sm", cfg.descColor)}>{description}</span>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={cn("ml-auto shrink-0", cfg.iconColor)} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
