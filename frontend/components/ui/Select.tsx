"use client";
import React, { forwardRef } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./Input";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  wrapperClassName?: string;
  id?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    { label, hint, error, placeholder = "Select option…", options, value, onValueChange,
      disabled, required, wrapperClassName, id },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrapper label={label} id={inputId} hint={hint} error={error} required={required} className={wrapperClassName}>
        <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
          <RadixSelect.Trigger
            ref={ref}
            id={inputId}
            className={cn(
              "inline-flex w-full items-center justify-between gap-2",
              "h-9 px-3 text-sm font-sans",
              "bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)]",
              "text-[var(--text-primary)] outline-none",
              "transition-all duration-150",
              "focus:border-[var(--green-500)] focus:ring-2 focus:ring-[var(--green-500)]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "data-[placeholder]:text-[var(--text-muted)]",
              error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
            )}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <RadixSelect.Portal>
            <RadixSelect.Content
              className={cn(
                "z-[var(--z-popover)] overflow-hidden min-w-[var(--radix-select-trigger-width)]",
                "bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)]",
                "shadow-[var(--shadow-lg)]",
                "animate-in fade-in-0 zoom-in-95 duration-100"
              )}
              position="popper"
              sideOffset={4}
            >
              <RadixSelect.Viewport className="p-1">
                {options.map((opt) => (
                  <RadixSelect.Item
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={cn(
                      "flex items-center justify-between gap-2",
                      "px-2.5 py-1.5 text-sm rounded-[var(--radius-md)] cursor-pointer outline-none select-none",
                      "text-[var(--text-primary)]",
                      "hover:bg-[var(--green-50)] hover:text-[var(--green-700)]",
                      "focus:bg-[var(--green-50)] focus:text-[var(--green-700)]",
                      "data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
                      "transition-colors duration-100"
                    )}
                  >
                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-[var(--green-600)]" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </FieldWrapper>
    );
  }
);
Select.displayName = "Select";
