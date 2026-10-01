"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  StatusBadge,
  Badge,
  EmptyState,
} from "@/components/ui";
import { api, BackendClaim } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.claims.list();
      setClaims(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load claims from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const stats = useMemo(() => {
    const total = claims.length;
    const underInvestigation = claims.filter(
      (c) =>
        c.status === "UNDER_INVESTIGATION" ||
        c.status === "PROCESSING"
    ).length;
    const requiresInfo = claims.filter((c) => c.status === "REQUIRES_INFO").length;
    const completed = claims.filter(
      (c) =>
        c.status === "APPROVED" ||
        c.status === "SETTLED" ||
        c.status === "REJECTED"
    ).length;

    return {
      total,
      underInvestigation,
      requiresInfo,
      completed,
    };
  }, [claims]);

  const recentClaims = useMemo(() => {
    return [...claims]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [claims]);

  return (
    <div className="space-y-6">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            Welcome back, {user?.fullName?.split(" ")[0] || "Policyholder"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track your insurance claims and submit required documentation in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClaims}
            disabled={isLoading}
            className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            title="Refresh claims"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/user/claims/new"
            className="h-9 px-4 flex items-center gap-2 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs hover:opacity-95 transition-opacity"
            style={{ backgroundColor: "var(--amber-600)" }}
          >
            <PlusCircle className="h-4 w-4" />
            File New Claim
          </Link>
        </div>
      </div>

      {/* Error notification if backend connection fails */}
      {error && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-center justify-between text-xs text-[var(--color-error-dark)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchClaims}
            className="underline font-semibold hover:opacity-80"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="My Claims"
          value={stats.total}
          icon={FileText}
          subtitle="Total claims submitted"
          accentColor="var(--green-700)"
        />
        <StatCard
          title="Under Investigation"
          value={stats.underInvestigation}
          icon={Clock}
          subtitle="Active review & analysis"
          accentColor="var(--color-info)"
        />
        <StatCard
          title="Requires Information"
          value={stats.requiresInfo}
          icon={AlertCircle}
          subtitle="Action needed by you"
          accentColor="var(--amber-600)"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          subtitle="Approved or resolved"
          accentColor="var(--color-success)"
        />
      </div>

      {/* Recent Claims Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <CardTitle className="text-sm font-bold">Recent Claims</CardTitle>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Your most recent insurance claims and real-time status
            </p>
          </div>
          {claims.length > 0 && (
            <Link
              href="/user/claims"
              className="text-xs font-semibold text-[var(--green-700)] hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading your claims…
              </p>
            </div>
          ) : recentClaims.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No claims yet"
                description="Your submitted claims will appear here once filed. Start by filing your first claim."
                action={
                  <Link
                    href="/user/claims/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs hover:opacity-95 transition-opacity"
                    style={{ backgroundColor: "var(--green-700)" }}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Submit Your First Claim
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] font-medium">
                    <th className="py-2.5 px-4 font-semibold">Claim ID</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold">Incident Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {recentClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="hover:bg-[var(--bg-subtle)]/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[var(--green-800)]">
                        <Link
                          href={`/user/claims/${claim.id}`}
                          className="hover:underline"
                        >
                          {claim.claim_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" size="sm">
                          {CLAIM_TYPE_LABELS[claim.claim_type] || claim.claim_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {formatDate(claim.incident_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(claim.claim_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={claim.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/user/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--green-700)] hover:underline"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
