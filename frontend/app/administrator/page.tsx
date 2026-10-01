"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  FileText,
  Tags,
  AlertTriangle,
  Scale,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [dashData, claimsData] = await Promise.all([
          api.getAdminDashboard(),
          api.listAdminClaims(),
        ]);
        setDashboard(dashData);
        setClaims(claimsData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load administrator dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const kpi = dashboard?.kpi || {
    totalPolicies: 0,
    activePolicies: 0,
    totalClaims: 0,
    claimsRequiringReview: 0,
    pendingSettlements: 0,
    totalSettledAmount: 0,
  };

  const recentActivity = dashboard?.recentActivity || [];
  const reviewQueue = claims.filter((c) => c.requires_human_review || c.status === "UNDER_REVIEW");

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
            Operations Console
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Administrator Intelligence Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time policyholder portfolio overview, multi-agent triage, and authorized settlement gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/administrator/policies/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Tags className="h-4 w-4" />
            <span>Add Policy Product</span>
          </Link>
          <Link
            href="/administrator/reviews"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Review Queue ({kpi.claimsRequiringReview})</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Policies */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Total Policies
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {loading ? "..." : kpi.totalPolicies}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {kpi.activePolicies} active in force
          </p>
        </div>

        {/* Total Claims */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Total Claims
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {loading ? "..." : kpi.totalClaims}
          </p>
          <Link
            href="/administrator/claims"
            className="text-[11px] text-[var(--green-700)] hover:underline mt-1 font-medium block"
          >
            Inspect master queue →
          </Link>
        </div>

        {/* Claims Requiring Review */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Requires Review
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {loading ? "..." : kpi.claimsRequiringReview}
          </p>
          <Link
            href="/administrator/reviews"
            className="text-[11px] text-amber-800 hover:underline mt-1 font-bold block"
          >
            Triage queue →
          </Link>
        </div>

        {/* Pending Settlements */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Pending Settlements
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {loading ? "..." : kpi.pendingSettlements}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Awaiting authorization
          </p>
        </div>

        {/* Total Settled */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Total Settled
          </p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">
            ${loading ? "..." : (kpi.totalSettledAmount || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            Disbursed
          </p>
        </div>
      </div>

      {/* Main Grid: Triage Queue & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Claims Requiring Attention */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Claims Requiring Human Review
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Flagged by Assessment or Anomaly Agent for specialist adjudication
                </p>
              </div>
              <Link
                href="/administrator/reviews"
                className="text-xs font-semibold text-[var(--green-700)] hover:underline"
              >
                View all ({reviewQueue.length})
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Loading claims...
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="py-8 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                No claims currently pending human review!
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {reviewQueue.slice(0, 5).map((claim) => (
                  <div
                    key={claim.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {claim.claim_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                          Human Review
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                        {claim.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Amount: <strong>${Number(claim.claim_amount || 0).toLocaleString()}</strong> • Policy: {claim.policy_number}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/administrator/claims/${claim.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition-colors"
                      >
                        Inspect & Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Audit Activity Log */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Activity className="h-4 w-4 text-emerald-700" />
                <span>Audit Activity Trail</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Live</span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Loading audit trail...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                No recent activity logged.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span className="font-bold text-emerald-800 uppercase">
                        {log.action}
                      </span>
                      <span>
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                      Actor: <span className="font-bold">{log.actor_type}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
