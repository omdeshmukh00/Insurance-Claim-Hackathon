"use client";
import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  /** Visual style */
  variant?: "underline" | "pill" | "contained";
}

export function Tabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  variant = "underline",
}: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList tabs={tabs} variant={variant} />
      {children}
    </RadixTabs.Root>
  );
}

export function TabsList({ tabs, variant = "underline" }: { tabs: Tab[]; variant?: TabsProps["variant"] }) {
  const listStyles = {
    underline:  "border-b border-[var(--border-default)] gap-0",
    pill:       "bg-[var(--bg-subtle)] p-1 rounded-[var(--radius-xl)] gap-1",
    contained:  "bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-1 gap-1",
  };
  const triggerBase = "inline-flex items-center gap-1.5 font-medium text-sm transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const triggerStyles = {
    underline: cn(
      triggerBase,
      "px-1 pb-3 pt-2 rounded-none border-b-2 border-transparent -mb-px",
      "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
      "data-[state=active]:border-[var(--green-600)] data-[state=active]:text-[var(--green-700)]"
    ),
    pill: cn(
      triggerBase,
      "px-3.5 py-1.5 rounded-[var(--radius-lg)]",
      "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      "data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--green-700)]",
      "data-[state=active]:shadow-[var(--shadow-sm)] data-[state=active]:font-semibold"
    ),
    contained: cn(
      triggerBase,
      "px-3.5 py-1.5 rounded-[var(--radius-lg)]",
      "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]",
      "data-[state=active]:bg-[var(--green-600)] data-[state=active]:text-white",
      "data-[state=active]:shadow-[var(--shadow-sm)]"
    ),
  };

  return (
    <RadixTabs.List className={cn("flex items-center", listStyles[variant ?? "underline"])}>
      {tabs.map((tab) => (
        <RadixTabs.Trigger
          key={tab.value}
          value={tab.value}
          disabled={tab.disabled}
          className={triggerStyles[variant ?? "underline"]}
        >
          {tab.icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px]",
                "px-1 text-[10px] font-semibold rounded-full",
                "bg-[var(--green-100)] text-[var(--green-700)]"
              )}
            >
              {tab.badge}
            </span>
          )}
        </RadixTabs.Trigger>
      ))}
    </RadixTabs.List>
  );
}

export function TabPanel({
  value,
  className,
  children,
  ...props
}: { value: string; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RadixTabs.Content
      value={value}
      className={cn(
        "mt-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]",
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1",
        "duration-150",
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.Content>
  );
}
