"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  StatusBadge,
  Badge,
  EmptyState,
} from "@/components/ui";
import { api, BackendClaim } from "@/lib/api";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<BackendClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadClaims = async () => {
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
    loadClaims();
  }, []);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesStatus =
        statusFilter === "all" ||
        claim.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "all" ||
        claim.claim_type.toLowerCase() === typeFilter.toLowerCase();

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        claim.claim_number.toLowerCase().includes(q) ||
        claim.policy_number.toLowerCase().includes(q) ||
        claim.title.toLowerCase().includes(q) ||
        (CLAIM_TYPE_LABELS[claim.claim_type] || "").toLowerCase().includes(q);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [claims, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
            All Claims
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            System-wide operational claims directory. Filter, search, and manage ongoing cases.
          </p>
        </div>
        <div>
          <button
            onClick={loadClaims}
            disabled={isLoading}
            className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by claim #, policy #, title, or type…"
                className="w-full h-9 pl-9 pr-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)] flex-1 md:w-36"
              >
                <option value="all">All Types</option>
                <option value="AUTO">Auto</option>
                <option value="PROPERTY">Property</option>
                <option value="HEALTH">Health</option>
                <option value="LIFE">Life</option>
                <option value="GENERAL">General</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--green-600)] flex-1 md:w-44"
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
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Loading claims directory…
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-[var(--color-error)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                Failed to load claims
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-4">{error}</p>
              <button
                onClick={loadClaims}
                className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]"
              >
                Retry
              </button>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title={claims.length === 0 ? "No claims in system" : "No matching claims"}
                description={
                  claims.length === 0
                    ? "No insurance claims have been registered in the database."
                    : "No claims matched your search query or filter selection."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-semibold">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Policy #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Date Filed</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Review</th>
                    <th className="py-3 px-4 text-right">Action</th>
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
                      <td className="py-3 px-4 max-w-[200px] truncate text-[var(--text-primary)] font-medium">
                        {claim.title}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {formatDate(claim.created_at)}
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
                            Yes
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
                          Workspace
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
