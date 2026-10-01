"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, User, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const backend = useBackendStatus();
  const { role, switchRole, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdminSection = pathname.startsWith("/administrator");

  const handleToggleRole = () => {
    if (role === "USER") {
      switchRole("ADMIN");
      router.push("/administrator");
    } else {
      switchRole("USER");
      router.push("/");
    }
  };

  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] sticky top-0 z-40 px-5 sm:px-6 flex items-center justify-between gap-4 shadow-[var(--shadow-xs)]">
      {/* Left: Role Indicator & Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isAdminSection ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              Administrator Console
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Policyholder Portal
            </span>
          )}
        </div>
      </div>

      {/* Right: Role Switcher, Status Pill, User Info */}
      <div className="flex items-center gap-3">
        {/* Backend API Status pill */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-[var(--bg-subtle)]",
            backend.isConnected
              ? "border-emerald-200 text-emerald-700"
              : "border-slate-200 text-slate-500"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              backend.isLoading
                ? "bg-amber-400 animate-pulse"
                : backend.isConnected
                ? "bg-emerald-500 animate-pulse"
                : "bg-slate-400"
            )}
          />
          {backend.isLoading ? "Connecting…" : backend.isConnected ? "API Live" : "API Offline"}
        </div>

        {/* Quick Portal Switcher */}
        {isAdminSection ? (
          <button
            onClick={() => {
              switchRole("USER");
              router.push("/");
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] transition-colors text-[var(--text-secondary)]"
            title="Switch to Policyholder experience"
          >
            <span>Exit to User Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </button>
        ) : (
          <button
            onClick={() => {
              switchRole("ADMIN");
              router.push("/administrator");
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors shadow-sm"
            title="Switch to Administrator area"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Admin Console</span>
          </button>
        )}

        {/* Active User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
          <div className="h-8 w-8 rounded-full bg-[var(--green-100)] text-[var(--green-700)] flex items-center justify-center font-semibold text-xs border border-[var(--green-200)]">
            {role === "ADMIN" ? "AD" : "AC"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
              {role === "ADMIN" ? "Administrator" : "Alice Claimant"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {role === "ADMIN" ? "admin@example.com" : "claimant@example.com"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
