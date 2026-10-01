"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  FileCheck2,
  FileText,
  Bot,
  User,
  ShieldAlert,
  ClipboardList,
  Tags,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
}

const userNavItems: NavItem[] = [
  { name: "Home", href: "/", icon: LayoutDashboard, exact: true },
  { name: "My Policies", href: "/policies", icon: FileCheck2 },
  { name: "My Claims", href: "/claims", icon: FileText },
  { name: "AI Assistant", href: "/assistant", icon: Bot, badge: "AI" },
  { name: "Profile", href: "/profile", icon: User },
];

const adminNavItems: NavItem[] = [
  { name: "Overview", href: "/administrator", icon: LayoutDashboard, exact: true },
  { name: "Policies & Pricing", href: "/administrator/policies", icon: Tags },
  { name: "Claims Inspector", href: "/administrator/claims", icon: FileText },
  { name: "Review Queue", href: "/administrator/reviews", icon: ClipboardList, badge: "Review" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const isAdminSection = pathname.startsWith("/administrator");

  const currentNav = isAdminSection ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-[var(--shadow-xs)]">
      {/* Branding */}
      <div className="h-16 border-b border-[var(--border-subtle)] px-5 flex items-center justify-between">
        <Link href={isAdminSection ? "/administrator" : "/"} className="flex items-center gap-3 group">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
            style={{
              background: isAdminSection
                ? "linear-gradient(135deg, #b45309, #d97706)"
                : "linear-gradient(135deg, var(--green-700), var(--green-500))",
            }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">
                InsuredYou
              </span>
              {isAdminSection && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-semibold">
              Claims Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {isAdminSection ? "Administration" : "Policyholder Workspace"}
        </p>

        {currentNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? isAdminSection
                    ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs font-semibold"
                    : "bg-[var(--green-50)] text-[var(--green-800)] border border-[var(--green-200)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors shrink-0",
                    isActive
                      ? isAdminSection
                        ? "text-amber-700"
                        : "text-[var(--green-600)]"
                      : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    isActive
                      ? isAdminSection
                        ? "bg-amber-200/80 text-amber-900"
                        : "bg-[var(--green-200)] text-[var(--green-800)]"
                      : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Quick Action Box */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
        {isAdminSection ? (
          <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Admin Mode</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Full authorization to inspect claims, adjust pricing, and approve settlements.
            </p>
            <Link
              href="/"
              className="block w-full py-1.5 text-center text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Exit to User Portal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/policies/upload"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:border-[var(--green-400)] hover:text-[var(--green-700)] text-[var(--text-primary)] transition-all shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-[var(--green-600)]" />
              <span>Add Existing Policy</span>
            </Link>
            <Link
              href="/claims/new"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white transition-all shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Submit New Claim</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
