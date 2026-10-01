"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu,
  RefreshCw,
  Play,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Badge,
  EmptyState,
} from "@/components/ui";
import { api, BackendClaim } from "@/lib/api";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency } from "@/lib/utils";

export default function AdminInvestigationsPage() {
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investigatingId, setInvestigatingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.claims.list();
      setClaims(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load claims.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunInvestigation = async (claimId: string) => {
    setInvestigatingId(claimId);
    try {
      await api.claims.triggerInvestigation(claimId);
      await loadData();
    } catch (err: any) {
      alert(`Investigation error: ${err.message}`);
    } finally {
      setInvestigatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            AI Investigations Hub
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Trigger and monitor multi-agent autonomous claim intake, document verification, policy RAG, and anomaly detection.
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
        <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Agents Architecture Banner */}
      <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--green-50)]/70 border border-[var(--green-200)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[var(--green-700)] text-white flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--green-900)]">
              Multi-Agent Orchestration Architecture
            </p>
            <p className="text-[11px] text-[var(--green-800)] mt-0.5 leading-relaxed">
              Document Processing → Policy Vector RAG → Coverage Reasoning → Cross-Discrepancy Anomaly Check → Settlement Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-[var(--green-800)] bg-white/80 px-2.5 py-1 rounded-full border border-[var(--green-200)]">
            Powered by Gemini AI
          </span>
        </div>
      </div>

      {/* Claims Investigation Table */}
      <Card>
        <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
          <CardTitle className="text-sm font-bold">
            Claims Eligible for Investigation ({claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading claims…
              </p>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Cpu}
                title="No claims available"
                description="No claims are currently in the system to investigate."
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
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Trigger Pipeline</th>
                    <th className="py-2.5 px-4 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {claims.map((claim) => (
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
                      <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(claim.claim_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={claim.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleRunInvestigation(claim.id)}
                          disabled={investigatingId === claim.id}
                          className="h-7 px-2.5 text-[11px] font-semibold rounded bg-[var(--green-700)] text-white hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {investigatingId === claim.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Running…</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              <span>Execute Agents</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--green-700)] hover:underline"
                        >
                          View Findings
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
