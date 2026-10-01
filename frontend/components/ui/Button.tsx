"use client";
import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: "primary" | "secondary" | "action" | "outline" | "ghost" | "danger" | "link";
  /** Size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Show spinner */
  isLoading?: boolean;
  /** Render as child element (Radix Slot pattern) */
  asChild?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const base = [
      "inline-flex items-center justify-center gap-2 font-medium",
      "transition-all duration-150 cursor-pointer select-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "relative overflow-hidden",
    ].join(" ");

    const variants: Record<string, string> = {
      primary: [
        "bg-[var(--green-600)] text-white",
        "hover:bg-[var(--green-700)] active:bg-[var(--green-800)]",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "focus-visible:ring-[var(--green-500)] focus-visible:ring-offset-[var(--bg-page)]",
        "border border-[var(--green-700)]",
      ].join(" "),
      secondary: [
        "bg-[var(--bg-card)] text-[var(--text-primary)]",
        "border border-[var(--border-default)]",
        "hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]",
        "shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]",
        "focus-visible:ring-[var(--green-500)] focus-visible:ring-offset-[var(--bg-page)]",
      ].join(" "),
      action: [
        "bg-[var(--amber-500)] text-[var(--text-on-amber)]",
        "hover:bg-[var(--amber-600)] active:bg-[var(--amber-700)]",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "focus-visible:ring-[var(--amber-400)] focus-visible:ring-offset-[var(--bg-page)]",
        "border border-[var(--amber-600)] font-semibold",
      ].join(" "),
      outline: [
        "bg-transparent text-[var(--green-600)]",
        "border border-[var(--green-600)]",
        "hover:bg-[var(--green-50)] active:bg-[var(--green-100)]",
        "focus-visible:ring-[var(--green-500)] focus-visible:ring-offset-[var(--bg-page)]",
      ].join(" "),
      ghost: [
        "bg-transparent text-[var(--text-secondary)]",
        "hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
        "focus-visible:ring-[var(--green-500)] focus-visible:ring-offset-[var(--bg-page)]",
      ].join(" "),
      danger: [
        "bg-[var(--color-error)] text-white",
        "hover:bg-[var(--color-error-dark)] active:bg-[var(--color-error-dark)]",
        "shadow-[var(--shadow-sm)]",
        "focus-visible:ring-red-400 focus-visible:ring-offset-[var(--bg-page)]",
        "border border-red-700",
      ].join(" "),
      link: [
        "bg-transparent text-[var(--green-600)] underline-offset-4",
        "hover:underline hover:text-[var(--green-700)]",
        "focus-visible:ring-[var(--green-500)]",
        "p-0 h-auto shadow-none",
      ].join(" "),
    };

    const sizes: Record<string, string> = {
      xs: "text-xs px-2.5 py-1 rounded-[var(--radius-md)] h-7",
      sm: "text-sm px-3.5 py-1.5 rounded-[var(--radius-md)] h-8",
      md: "text-sm px-4 py-2 rounded-[var(--radius-lg)] h-9",
      lg: "text-base px-5 py-2.5 rounded-[var(--radius-lg)] h-11",
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], variant !== "link" && sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
