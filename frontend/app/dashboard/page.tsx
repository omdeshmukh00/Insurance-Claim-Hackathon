"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Cpu, AlertTriangle, UserCheck, CheckCircle2,
  DollarSign, Search, Filter, ArrowUpRight, TrendingUp,
  Clock, ShieldAlert,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardContent, StatCard,
  Badge, StatusBadge,
  DataTable, type DataTableColumn,
} from "@/components/ui";
import { getAllClaims, getDashboardStats } from "@/lib/mockClaims";
import { CLAIM_TYPE_LABELS, AI_RECOMMENDATION_LABELS, aiRecommendationVariant, priorityVariant, PRIORITY_LABELS, STATUS_OPTIONS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClaimDetail } from "@/types/claimDetail";

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");

  const claims = useMemo(() => getAllClaims(), []);
  const stats  = useMemo(() => getDashboardStats(), []);

  const filtered = useMemo(() => {
    let list = claims;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.policyHolder.name.toLowerCase().includes(q) ||
          c.policyHolder.policyNumber.toLowerCase().includes(q) ||
          CLAIM_TYPE_LABELS[c.type].toLowerCase().includes(q)
      );
    }
    return list;
  }, [claims, search, statusFilter]);

  const columns: DataTableColumn<ClaimDetail>[] = [
    {
      key: "claimNumber",
      header: "Claim ID",
      sortable: true,
      width: "140px",
      accessor: (r) => (
        <Link href={`/claims/${r.id}`} className="font-mono text-xs font-semibold text-[var(--green-700)] hover:underline">
          {r.claimNumber}
        </Link>
      ),
    },
    {
      key: "claimant",
      header: "Claimant",
      sortable: true,
      accessor: (r) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{r.policyHolder.name}</p>
          <p className="text-xs text-[var(--text-tertiary)] font-mono">{r.policyHolder.policyNumber}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Claim Type",
      sortable: true,
      accessor: (r) => (
        <Badge variant="outline" size="sm">{CLAIM_TYPE_LABELS[r.type]}</Badge>
      ),
    },
    {
      key: "estimatedLoss",
      header: "Amount",
      sortable: true,
      align: "right",
      accessor: (r) => (
        <span className="font-semibold text-sm tabular-nums text-[var(--text-primary)]">
          {formatCurrency(r.estimatedLoss)}
        </span>
      ),
    },
    {
      key: "filingDate",
      header: "Filed",
      sortable: true,
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
        <Badge variant={priorityVariant(r.priority)} size="sm">
          {PRIORITY_LABELS[r.priority]}
        </Badge>
      ),
    },
    {
      key: "aiRecommendation",
      header: "AI Verdict",
      accessor: (r) =>
        r.aiRecommendation ? (
          <div className="flex items-center gap-1.5">
            <Badge variant={aiRecommendationVariant(r.aiRecommendation)} size="sm">
              {AI_RECOMMENDATION_LABELS[r.aiRecommendation]}
            </Badge>
            {r.aiConfidence !== undefined && (
              <span className="text-[10px] text-[var(--text-muted)]">{r.aiConfidence}%</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "action",
      header: "",
      width: "40px",
      accessor: (r) => (
        <Link href={`/claims/${r.id}`}>
          <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] hover:text-[var(--green-600)] transition-colors" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-7 page-enter">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Claims Operations Dashboard
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            AI-assisted claims intelligence · Real-time queue management
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-lg)] text-sm font-semibold bg-[var(--amber-500)] text-[var(--text-on-amber)] hover:bg-[var(--amber-600)] transition-colors shadow-[var(--shadow-sm)] border border-[var(--amber-600)]"
        >
          <FileText className="h-4 w-4" />
          File New Claim
        </Link>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Claims"
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Under Investigation"
          value={stats.underInvestigation}
          deltaType="neutral"
          icon={<Cpu className="h-5 w-5" />}
        />
        <StatCard
          label="Requires Info"
          value={stats.requiresInfo}
          deltaType="neutral"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Needs Review"
          value={stats.requiresReview}
          deltaType="neutral"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Auto-Processed"
          value={stats.autoProcessed}
          delta="AI approved"
          deltaType="positive"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {/* ── Secondary metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--green-50)] text-[var(--green-600)] shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Total Exposure</p>
              <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{formatCurrency(stats.totalEstimatedLoss)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--amber-50)] text-[var(--amber-600)] shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Avg. Fraud Score</p>
              <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{stats.avgFraudScore}<span className="text-sm font-normal text-[var(--text-tertiary)]">/100</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-info-light)] text-[var(--color-info)] shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest">AI Automation Rate</p>
              <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                {Math.round((stats.autoProcessed / stats.total) * 100)}%
                <span className="text-sm font-normal text-[var(--text-tertiary)] ml-1">of resolved</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Claims Table ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--text-muted)]" />
            <CardTitle>Recent Claims Queue</CardTitle>
            <Badge variant="primary" size="sm">{filtered.length} claims</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, name, policy…"
                className="h-8 pl-8 pr-3 text-xs w-52 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--green-400)] focus:ring-2 focus:ring-[var(--green-500)]/15 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 px-2.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] outline-none text-[var(--text-primary)] focus:border-[var(--green-400)] transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          emptyTitle="No claims match your search"
          emptyDescription="Try adjusting the filters or search query."
          onRowClick={(r) => router.push(`/claims/${r.id}`)}
        />
      </Card>
    </div>
  );
}
