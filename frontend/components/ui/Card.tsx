import React from "react";
import { cn } from "@/lib/utils";

/* ── Root Card ── */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevate card shadow */
  elevated?: boolean;
  /** Remove padding from content */
  flush?: boolean;
}
export function Card({ className, elevated = false, flush = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-card)] rounded-[var(--radius-xl)]",
        "border border-[var(--border-subtle)]",
        elevated ? "shadow-[var(--shadow-lg)]" : "shadow-[var(--shadow-card)]",
        "transition-shadow duration-200",
        flush ? "" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card Header ── */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove bottom border */
  borderless?: boolean;
}
export function CardHeader({ className, borderless = false, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 flex items-center justify-between gap-3",
        !borderless && "border-b border-[var(--border-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card Title ── */
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold text-[var(--text-primary)] tracking-tight leading-snug",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/* ── Card Description ── */
export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[var(--text-tertiary)] leading-relaxed mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

/* ── Card Content ── */
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

/* ── Card Footer ── */
export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-3 flex items-center justify-between gap-3",
        "border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]",
        "rounded-b-[var(--radius-xl)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Stat Card ── */
export interface StatCardProps {
  label?: string;
  title?: string;
  subtitle?: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  accentColor?: string;
  className?: string;
}
export function StatCard({
  label,
  title,
  subtitle,
  value,
  delta,
  deltaType = "neutral",
  icon,
  accentColor,
  className,
}: StatCardProps) {
  const displayTitle = title || label || "";
  const deltaColors = {
    positive: "text-[var(--color-success)] bg-[var(--color-success-light)]",
    negative: "text-[var(--color-error)]   bg-[var(--color-error-light)]",
    neutral:  "text-[var(--text-tertiary)]  bg-[var(--bg-subtle)]",
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="h-5 w-5" />;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider truncate">
              {displayTitle}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {subtitle}
              </p>
            )}
            {delta && (
              <span className={cn("inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium", deltaColors[deltaType])}>
                {delta}
              </span>
            )}
          </div>
          {icon && (
            <div
              className="shrink-0 p-2 sm:p-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] text-[var(--green-700)]"
              style={accentColor ? { color: accentColor } : undefined}
            >
              {renderIcon()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
