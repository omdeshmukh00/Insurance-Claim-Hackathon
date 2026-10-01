"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, ArrowUpRight, Plus } from "lucide-react";
import {
  Card, CardContent, Badge, StatusBadge,
  DataTable, type DataTableColumn,
} from "@/components/ui";
import { getAllClaims } from "@/lib/mockClaims";
import {
  CLAIM_TYPE_LABELS, AI_RECOMMENDATION_LABELS, aiRecommendationVariant,
  priorityVariant, PRIORITY_LABELS, STATUS_OPTIONS, CLAIM_TYPE_OPTIONS,
} from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClaimDetail } from "@/types/claimDetail";
import type { ClaimType, ClaimStatus } from "@/types/claims";

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest First" },
  { value: "oldest",   label: "Oldest First" },
  { value: "highest",  label: "Highest Amount" },
  { value: "lowest",   label: "Lowest Amount" },
  { value: "priority", label: "Priority" },
];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ClaimsPage() {
  const router = useRouter();
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState<"all" | ClaimStatus>("all");
  const [claimType,  setClaimType]  = useState<"all" | ClaimType>("all");
  const [sortBy,     setSortBy]     = useState("newest");

  const claims = useMemo(() => getAllClaims(), []);

  const filtered = useMemo(() => {
    let list = [...claims];
    if (status    !== "all") list = list.filter((c) => c.status === status);
    if (claimType !== "all") list = list.filter((c) => c.type   === claimType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.policyHolder.name.toLowerCase().includes(q) ||
          c.policyHolder.policyNumber.toLowerCase().includes(q) ||
          c.incidentLocation.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "oldest":   list.sort((a, b) => a.filingDate.localeCompare(b.filingDate)); break;
      case "highest":  list.sort((a, b) => b.estimatedLoss - a.estimatedLoss); break;
      case "lowest":   list.sort((a, b) => a.estimatedLoss - b.estimatedLoss); break;
      case "priority": list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]); break;
      default:         list.sort((a, b) => b.filingDate.localeCompare(a.filingDate)); break;
    }
    return list;
  }, [claims, search, status, claimType, sortBy]);

  const columns: DataTableColumn<ClaimDetail>[] = [
    {
      key: "claimNumber",
      header: "Claim ID",
      sortable: false,
      width: "140px",
      accessor: (r) => (
        <span className="font-mono text-xs font-semibold text-[var(--green-700)]">{r.claimNumber}</span>
      ),
    },
    {
      key: "claimant",
      header: "Claimant",
      sortable: false,
      accessor: (r) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{r.policyHolder.name}</p>
          <p className="text-xs text-[var(--text-tertiary)] font-mono">{r.policyHolder.policyNumber}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: false,
      accessor: (r) => <Badge variant="outline" size="sm">{CLAIM_TYPE_LABELS[r.type]}</Badge>,
    },
    {
      key: "incidentLocation",
      header: "Location",
      sortable: false,
      accessor: (r) => (
        <span className="text-xs text-[var(--text-secondary)] max-w-[180px] truncate block" title={r.incidentLocation}>
          {r.incidentLocation}
        </span>
      ),
    },
    {
      key: "estimatedLoss",
      header: "Amount",
      sortable: false,
      align: "right",
      accessor: (r) => (
        <span className="font-semibold text-sm tabular-nums">{formatCurrency(r.estimatedLoss)}</span>
      ),
    },
    {
      key: "filingDate",
      header: "Filed",
      sortable: false,
      accessor: (r) => <span className="text-xs text-[var(--text-tertiary)]">{formatDate(r.filingDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (r) => (
        <Badge variant={priorityVariant(r.priority)} size="sm">{PRIORITY_LABELS[r.priority]}</Badge>
      ),
    },
    {
      key: "ai",
      header: "AI Verdict",
      accessor: (r) =>
        r.aiRecommendation ? (
          <Badge variant={aiRecommendationVariant(r.aiRecommendation)} size="sm">
            {AI_RECOMMENDATION_LABELS[r.aiRecommendation]}
          </Badge>
        ) : <span className="text-xs text-[var(--text-muted)]">Pending</span>,
    },
    {
      key: "action",
      header: "",
      width: "40px",
      accessor: () => (
        <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--green-600)] transition-colors" />
      ),
    },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Claims</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            {claims.length} total claims · {filtered.length} shown
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-lg)] text-sm font-semibold bg-[var(--amber-500)] text-[var(--text-on-amber)] hover:bg-[var(--amber-600)] transition-colors border border-[var(--amber-600)] shadow-[var(--shadow-sm)]"
        >
          <Plus className="h-4 w-4" />
          New Claim
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claims, claimants, policies…"
                className="h-8 pl-8 pr-3 text-xs w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--green-400)] focus:ring-2 focus:ring-[var(--green-500)]/15 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | ClaimStatus)}
              className="h-8 px-2.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] focus:border-[var(--green-400)] transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as "all" | ClaimType)}
              className="h-8 px-2.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] focus:border-[var(--green-400)] transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              {CLAIM_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-2.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] focus:border-[var(--green-400)] transition-all cursor-pointer ml-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="No claims found"
        emptyDescription="Try adjusting your filters or search terms."
        onRowClick={(r) => router.push(`/claims/${r.id}`)}
      />
    </div>
  );
}
