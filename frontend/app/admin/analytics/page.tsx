"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  DollarSign,
  PieChart,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Badge,
  EmptyState,
} from "@/components/ui";
import { api, BackendClaim, BackendAuditLog } from "@/lib/api";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [auditLogs, setAuditLogs] = useState<BackendAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [claimsData, logsData] = await Promise.all([
        api.claims.list(),
        api.audit.getAllLogs().catch(() => []),
      ]);
      setClaims(claimsData || []);
      setAuditLogs(logsData || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load operational analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const total = claims.length;
    const totalClaimed = claims.reduce((acc, c) => acc + (c.claim_amount || 0), 0);
    const avgClaim = total > 0 ? totalClaimed / total : 0;

    const requiresReviewCount = claims.filter((c) => c.requires_human_review).length;
    const reviewRate = total > 0 ? ((requiresReviewCount / total) * 100).toFixed(1) : "0.0";

    const typeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};

    claims.forEach((c) => {
      const typeKey = CLAIM_TYPE_LABELS[c.claim_type] || c.claim_type;
      typeBreakdown[typeKey] = (typeBreakdown[typeKey] || 0) + 1;

      const statusKey = c.status;
      statusBreakdown[statusKey] = (statusBreakdown[statusKey] || 0) + 1;
    });

    return {
      total,
      totalClaimed,
      avgClaim,
      reviewRate,
      typeBreakdown,
      statusBreakdown,
    };
  }, [claims]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            Operational Analytics & Audit
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            System throughput, claim portfolio distribution, and tamper-evident audit logs computed from live database records.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-center justify-between text-xs text-[var(--color-error-dark)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Claims Volume"
          value={metrics.total}
          icon={BarChart3}
          subtitle="Portfolio claims count"
          accentColor="var(--green-700)"
        />
        <StatCard
          title="Total Incurred Loss"
          value={formatCurrency(metrics.totalClaimed)}
          icon={DollarSign}
          subtitle="Cumulative claimed amount"
          accentColor="var(--amber-600)"
        />
        <StatCard
          title="Average Claim Size"
          value={formatCurrency(metrics.avgClaim)}
          icon={DollarSign}
          subtitle="Mean per submitted case"
          accentColor="var(--color-info)"
        />
        <StatCard
          title="Human Escalation Rate"
          value={`${metrics.reviewRate}%`}
          icon={ShieldCheck}
          subtitle="Claims requiring human review"
          accentColor="var(--color-warning)"
        />
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Claim Type */}
        <Card>
          <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[var(--green-700)]" />
              Volume by Line of Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {Object.keys(metrics.typeBreakdown).length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No claim records to analyze.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.typeBreakdown).map(([label, count]) => {
                  const pct = ((count / metrics.total) * 100).toFixed(0);
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {label}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--green-700)] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--amber-600)]" />
              Claims Lifecycle Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {Object.keys(metrics.statusBreakdown).length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No status data available.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.statusBreakdown).map(([status, count]) => {
                  const pct = ((count / metrics.total) * 100).toFixed(0);
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)] uppercase">
                          {status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--amber-600)] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Audit Logs Table */}
      <Card>
        <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--green-700)]" />
            Global System Audit Stream ({auditLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading audit logs…
              </p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Clock}
                title="No audit entries logged"
                description="Administrative audit records will appear here as users and agents interact with the platform."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Entity ID</th>
                    <th className="py-2.5 px-4">Actor Type</th>
                    <th className="py-2.5 px-4">Actor ID</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-subtle)]/40">
                      <td className="py-2.5 px-4 font-bold text-[var(--green-800)]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                        {log.entity_type}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                        {log.entity_id ? `${log.entity_id.substring(0, 10)}…` : "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" size="sm">
                          {log.actor_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-tertiary)]">
                        {log.actor_id.substring(0, 10)}…
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-tertiary)]">
                        {formatDate(log.created_at)}
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
