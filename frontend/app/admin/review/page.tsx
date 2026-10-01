"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  RefreshCw,
  Search,
  ArrowRight,
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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminReviewPage() {
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const loadClaims = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.claims.list();
      setClaims(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load review queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const reviewClaims = useMemo(() => {
    return claims.filter((claim) => {
      const isReviewRequired =
        claim.requires_human_review ||
        claim.status === "UNDER_REVIEW" ||
        claim.status === "REQUIRES_INFO";

      if (!showAll && !isReviewRequired) {
        return false;
      }

      const q = search.trim().toLowerCase();
      if (!q) return true;

      return (
        claim.claim_number.toLowerCase().includes(q) ||
        claim.policy_number.toLowerCase().includes(q) ||
        claim.claimant_id.toLowerCase().includes(q) ||
        (CLAIM_TYPE_LABELS[claim.claim_type] || "").toLowerCase().includes(q)
      );
    });
  }, [claims, showAll, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            Human Review Queue
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Claims flagged by AI assessment for adjuster decision, information requests, or policy validation.
          </p>
        </div>
        <button
          onClick={loadClaims}
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

      {/* Filter and Toggle Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search review queue by claim #, policy #, claimant…"
              className="w-full h-9 pl-9 pr-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-colors ${
                !showAll
                  ? "bg-[var(--amber-500)] text-white shadow-xs"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Needs Attention ({claims.filter((c) => c.requires_human_review || c.status === "UNDER_REVIEW" || c.status === "REQUIRES_INFO").length})
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-colors ${
                showAll
                  ? "bg-[var(--green-700)] text-white shadow-xs"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Claims ({claims.length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Review Queue Table */}
      <Card>
        <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[var(--amber-600)]" />
            Pending Adjuster Actions ({reviewClaims.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading review queue…
              </p>
            </div>
          ) : reviewClaims.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserCheck}
                title="Review queue empty"
                description={
                  showAll
                    ? "No claims exist in the system yet."
                    : "No claims currently require human review. All claims are in automated or completed states."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-semibold">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Claimant</th>
                    <th className="py-3 px-4">Claim Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Review Status</th>
                    <th className="py-3 px-4">Date Filed</th>
                    <th className="py-3 px-4 text-right">Inspect & Decide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {reviewClaims.map((claim) => (
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
                        {claim.claimant_id.substring(0, 8)}…
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
                        {claim.requires_human_review ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--amber-50)] text-[var(--amber-800)] border border-[var(--amber-300)]">
                            Human Review Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {formatDate(claim.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--green-700)] text-white hover:opacity-95 shadow-xs"
                        >
                          Open Review
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
