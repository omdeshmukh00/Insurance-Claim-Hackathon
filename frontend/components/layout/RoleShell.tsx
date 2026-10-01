"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Cpu,
  UserCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const USER_NAV_ITEMS: NavLinkItem[] = [
  { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard, exact: true },
  { name: "My Claims", href: "/user/claims", icon: FileText },
  { name: "New Claim", href: "/user/claims/new", icon: PlusCircle },
];

const ADMIN_NAV_ITEMS: NavLinkItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Claims", href: "/admin/claims", icon: FileText },
  { name: "AI Investigations", href: "/admin/investigations", icon: Cpu },
  { name: "Review Required", href: "/admin/review", icon: UserCheck },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

interface RoleShellProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

export function RoleShell({ requiredRole, children }: RoleShellProps) {
  const { user, role, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Route protection guard
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRole === "ADMIN" && role !== "ADMIN") {
      router.replace("/user/dashboard");
      return;
    }

    if (requiredRole === "USER" && role === "ADMIN") {
      // If admin visits /user, route to admin console
      router.replace("/admin/dashboard");
      return;
    }
  }, [user, role, requiredRole, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  // Double check authorization mismatch while transition is taking place
  if (requiredRole === "ADMIN" && role !== "ADMIN") {
    return null;
  }
  if (requiredRole === "USER" && role === "ADMIN") {
    return null;
  }

  const navItems = requiredRole === "USER" ? USER_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const isUserView = requiredRole === "USER";

  function isItemActive(item: NavLinkItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div
      className="flex min-h-screen antialiased overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-card)] flex-col h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="h-16 border-b border-[var(--border-subtle)] px-5 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 shadow-xs"
            style={{
              background:
                "linear-gradient(135deg, var(--green-700), var(--green-900))",
            }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-tight truncate">
              ClaimIntel AI
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">
              {isUserView ? "Policyholder Portal" : "Operations Console"}
            </p>
          </div>
        </div>

        {/* Quick Action Button for User View */}
        {isUserView && (
          <div className="p-3 pb-0">
            <Link
              href="/user/claims/new"
              className="flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs transition-opacity hover:opacity-95"
              style={{ backgroundColor: "var(--amber-600)" }}
            >
              <PlusCircle className="h-4 w-4" />
              File New Claim
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Navigation
          </p>
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors",
                  active
                    ? "bg-[var(--green-700)] text-white font-semibold shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-white"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {!active && (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
          <div className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] mb-2 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                background: isUserView
                  ? "linear-gradient(135deg, var(--green-600), var(--green-800))"
                  : "linear-gradient(135deg, var(--amber-600), var(--amber-800))",
              }}
            >
              {user.fullName ? user.fullName[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {user.fullName || user.email}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                {isUserView ? "Claimant" : user.backendRole || "Administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-3 text-xs font-medium rounded-[var(--radius-md)] text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] border border-transparent hover:border-[var(--color-error)]/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (backdrop & sidebar) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col h-full z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 border-b border-[var(--border-subtle)] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--green-700), var(--green-900))",
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    ClaimIntel AI
                  </p>
                  <p className="text-[9px] text-[var(--text-tertiary)] font-semibold uppercase">
                    {isUserView ? "User Portal" : "Admin Console"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isUserView && (
              <div className="p-3 pb-0">
                <Link
                  href="/user/claims/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs"
                  style={{ backgroundColor: "var(--amber-600)" }}
                >
                  <PlusCircle className="h-4 w-4" />
                  File New Claim
                </Link>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors",
                      active
                        ? "bg-[var(--green-700)] text-white font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
              <div className="flex items-center gap-2 mb-2 p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div className="h-7 w-7 rounded-full bg-[var(--green-700)] text-white text-[11px] font-bold flex items-center justify-center">
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-medium">
                    {isUserView ? "Claimant" : "Admin"}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full py-1.5 text-xs text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-[var(--radius-md)] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* View Badge / Header Label */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                  isUserView
                    ? "bg-[var(--green-50)] text-[var(--green-800)] border-[var(--green-200)]"
                    : "bg-[var(--amber-50)] text-[var(--amber-800)] border-[var(--amber-300)]"
                )}
              >
                {isUserView ? "User Portal" : "Admin View"}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                {user.fullName || user.email}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                {isUserView ? "Customer Account" : user.backendRole || "Administrator"}
              </p>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="h-8 px-2.5 flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
