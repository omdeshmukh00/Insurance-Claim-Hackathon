"use client";
import React from "react";
import { Bell, Search } from "lucide-react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { cn } from "@/lib/utils";

export function Navbar() {
  const backend = useBackendStatus();

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] sticky top-0 z-40 px-5 flex items-center justify-between gap-4 shadow-[var(--shadow-xs)]">
      {/* Search */}
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search claims, policies, adjusters…"
          className={cn(
            "w-full h-8 pl-8 pr-3 text-xs",
            "bg-[var(--bg-subtle)] border border-[var(--border-subtle)]",
            "rounded-[var(--radius-lg)] outline-none",
            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "focus:border-[var(--green-400)] focus:ring-2 focus:ring-[var(--green-500)]/15",
            "transition-all duration-150"
          )}
          readOnly
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* API Status pill */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium",
            "border bg-[var(--bg-subtle)]",
            backend.isConnected
              ? "border-[var(--green-200)] text-[var(--color-success-dark)]"
              : "border-[var(--border-default)] text-[var(--text-tertiary)]"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              backend.isLoading
                ? "bg-[var(--color-warning)] animate-pulse"
                : backend.isConnected
                ? "bg-[var(--color-success)] animate-pulse"
                : "bg-[var(--text-muted)]"
            )}
          />
          {backend.isLoading
            ? "Connecting…"
            : backend.isConnected
            ? "API Online"
            : "API Offline"}
        </div>

        {/* Notifications */}
        <button
          className={cn(
            "relative h-8 w-8 flex items-center justify-center rounded-[var(--radius-lg)]",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--bg-subtle)] transition-colors",
            "border border-transparent hover:border-[var(--border-subtle)]"
          )}
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--amber-500)]" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--border-subtle)] mx-1" />

        {/* User avatar */}
        <button
          className="flex items-center gap-2.5 hover:bg-[var(--bg-subtle)] px-2 py-1 rounded-[var(--radius-lg)] transition-colors"
          aria-label="Account"
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, var(--green-600), var(--green-800))" }}
          >
            CA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-none">Claims Adjuster</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Tier 2 Specialist</p>
          </div>
        </button>
      </div>
    </header>
  );
}
