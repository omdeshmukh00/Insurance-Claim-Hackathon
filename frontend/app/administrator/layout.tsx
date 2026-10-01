"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, switchRole, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/administrator/login";

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-[var(--text-muted)]">
        Verifying administrator role access...
      </div>
    );
  }

  // If not admin and not already on login page, display administrator gate
  if (role !== "ADMIN" && !isLoginPage) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="h-8 w-8 text-amber-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Administrator Access Required
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
            This console is restricted to insurance operations, underwriters, and claims officers. Your current session has role <strong>{role}</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 text-left space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            <span>Backend Security Guard Enforced</span>
          </div>
          <p className="text-[11px] text-amber-800">
            All backend endpoints under <code>/api/admin/*</code> strictly verify bearer tokens and return <code>403 Forbidden</code> for unauthorized roles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              switchRole("ADMIN");
              router.refresh();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
          >
            <span>Activate Admin Role</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Return to User Portal
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
