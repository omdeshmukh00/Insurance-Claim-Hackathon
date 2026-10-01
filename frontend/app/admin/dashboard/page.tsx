"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  UserCheck,
  AlertCircle,
  Cpu,
  CheckCircle2,
  Search,
  ArrowRight,
  RefreshCw,
  ExternalLink,
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
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.claims.list();
      setClaims(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load operational claims data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = claims.length;
    const underInvestigation = claims.filter(
      (c) => c.status === "UNDER_INVESTIGATION" || c.status === "PROCESSING"
    ).length;
    const requiresReview = claims.filter(
      (c) => c.requires_human_review || c.status === "UNDER_REVIEW"
    ).length;
    const requiresInfo = claims.filter((c) => c.status === "REQUIRES_INFO").length;
    const automatedProcessing = claims.filter((c) => c.status === "PROCESSING").length;
    const completed = claims.filter(
      (c) =>
        c.status === "APPROVED" ||
        c.status === "SETTLED" ||
        c.status === "REJECTED"
    ).length;

    return {
      total,
      underInvestigation,
      requiresReview,
      requiresInfo,
      automatedProcessing,
      completed,
    };
  }, [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchesStatus =
        statusFilter === "all" ||
        c.status.toLowerCase() === statusFilter.toLowerCase();

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.claim_number.toLowerCase().includes(q) ||
        c.policy_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (CLAIM_TYPE_LABELS[c.claim_type] || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [claims, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            Operations & Claims Intelligence
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time pipeline monitoring, automated multi-agent triage, and adjuster review queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/review"
            className="h-9 px-3.5 flex items-center gap-2 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs hover:opacity-95 transition-opacity"
            style={{ backgroundColor: "var(--amber-600)" }}
          >
            <UserCheck className="h-4 w-4" />
            Review Queue ({stats.requiresReview})
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-center justify-between text-xs text-[var(--color-error-dark)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="underline font-semibold hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Claims"
          value={stats.total}
          icon={FileText}
          subtitle="All received"
          accentColor="var(--green-700)"
        />
        <StatCard
          title="Under Investigation"
          value={stats.underInvestigation}
          icon={Clock}
          subtitle="AI Agent active"
          accentColor="var(--color-info)"
        />
        <StatCard
          title="Requires Review"
          value={stats.requiresReview}
          icon={UserCheck}
          subtitle="Adjuster action"
          accentColor="var(--amber-600)"
        />
        <StatCard
          title="Requires Info"
          value={stats.requiresInfo}
          icon={AlertCircle}
          subtitle="Waiting on docs"
          accentColor="var(--amber-700)"
        />
        <StatCard
          title="Automated"
          value={stats.automatedProcessing}
          icon={Cpu}
          subtitle="Zero-touch processing"
          accentColor="var(--green-600)"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          subtitle="Settled / Closed"
          accentColor="var(--color-success)"
        />
      </div>

      {/* Quick Access Operational Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/review"
          className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--amber-500)] shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-[var(--amber-500)]" />
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Review Required Queue
              </p>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {stats.requiresReview} claim{stats.requiresReview === 1 ? "" : "s"} currently flagged for human decision or coverage validation.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--amber-600)] transition-colors mt-1" />
        </Link>

        <Link
          href="/admin/investigations"
          className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--green-600)] shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-[var(--green-600)]" />
              <p className="text-xs font-bold text-[var(--text-primary)]">
                AI Investigations Hub
              </p>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Inspect multi-agent reasoning, document extraction, coverage validation, and anomaly checks.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--green-700)] transition-colors mt-1" />
        </Link>
      </div>

      {/* Operational Claims Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <CardTitle className="text-sm font-bold">
              Operations Claims Queue
            </CardTitle>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Live claims feed from backend database
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claims…"
                className="h-8 pl-8 pr-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)] w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)]"
            >
              <option value="all">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PROCESSING">Processing</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="REQUIRES_INFO">Requires Info</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading claims…
              </p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title={claims.length === 0 ? "No claims registered yet" : "No matching claims"}
                description={
                  claims.length === 0
                    ? "The backend database has no claims yet. When users submit claims or data is ingested, claims will appear here."
                    : "No claims matched your search or status filter."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-semibold">
                    <th className="py-2.5 px-4">Claim ID</th>
                    <th className="py-2.5 px-4">Policy #</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Incident Date</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Review Flag</th>
                    <th className="py-2.5 px-4 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="hover:bg-[var(--bg-subtle)]/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[var(--green-800)]">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="hover:underline"
                        >
                          {claim.claim_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                        {claim.policy_number}
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
                      <td className="py-3 px-4 text-center">
                        {claim.requires_human_review ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--amber-50)] text-[var(--amber-800)] border border-[var(--amber-200)]">
                            Review Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--green-700)] hover:underline"
                        >
                          Open Workspace
                          <ExternalLink className="h-3 w-3" />
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
