"use client";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ── Shared field wrapper ── */
export interface FieldWrapperProps {
  label?: string;
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
export function FieldWrapper({ label, id, hint, error, required, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[var(--text-secondary)] select-none"
        >
          {label}
          {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
        </label>
      )}
      {children}
      {(hint || error) && (
        <p className={cn("text-xs", error ? "text-[var(--color-error)]" : "text-[var(--text-tertiary)]")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/* ── Shared input classes ── */
const inputBase = [
  "w-full font-sans text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "bg-[var(--bg-card)] border border-[var(--border-default)]",
  "rounded-[var(--radius-lg)] outline-none",
  "transition-all duration-150",
  "focus:border-[var(--green-500)] focus:ring-2 focus:ring-[var(--green-500)]/20",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)]",
  "read-only:bg-[var(--bg-subtle)] read-only:cursor-default",
].join(" ");

/* ── Input ── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  wrapperClassName?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftAddon, rightAddon, className, wrapperClassName, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrapper label={label} id={inputId} hint={hint} error={error} required={required} className={wrapperClassName}>
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none [&>svg]:h-4 [&>svg]:w-4">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputBase,
              "h-9 px-3 py-2 text-sm",
              leftAddon  && "pl-9",
              rightAddon && "pr-9",
              error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none [&>svg]:h-4 [&>svg]:w-4">
              {rightAddon}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);
Input.displayName = "Input";

/* ── Textarea ── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, wrapperClassName, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrapper label={label} id={inputId} hint={hint} error={error} required={required} className={wrapperClassName}>
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            "min-h-[100px] px-3 py-2.5 text-sm resize-y",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
Textarea.displayName = "Textarea";
