"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  Cpu,
  FolderOpen,
  Calculator,
  UserCheck,
  BarChart3,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Overview",          href: "/",              icon: BarChart3 },
  { name: "Claims Queue",      href: "/claims",        icon: FileText,    badge: "8" },
  { name: "AI Investigation",  href: "/investigation", icon: Cpu,         badge: "Live" },
  { name: "Evidence Vault",    href: "/evidence",      icon: FolderOpen },
  { name: "Assessment",        href: "/assessment",    icon: Calculator },
  { name: "Review & Approval", href: "/review",        icon: UserCheck,   badge: "3" },
  { name: "Settings",          href: "/settings",      icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Branding */}
      <div className="h-14 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--green-600), var(--green-800))" }}
        >
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none">ClaimIntel</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 tracking-wide font-medium">CLAIMS INTELLIGENCE</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5">
        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Workspace
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-2.5 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--green-600)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-white" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]")} />
                {item.name}
              </div>

              <div className="flex items-center gap-1">
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-[var(--green-100)] text-[var(--green-700)]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {!item.badge && !isActive && (
                  <ChevronRight className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <div className="px-2.5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              System Status
            </span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-[10px] text-[var(--color-success)] font-medium">Online</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Frontend ↔ Backend API :5000
          </p>
        </div>
      </div>
    </aside>
  );
}
