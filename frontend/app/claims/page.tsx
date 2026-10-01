"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClaimsListPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadClaims() {
      try {
        setLoading(true);
        const data = await api.listClaims();
        setClaims(data || []);
      } catch (err) {
        console.error("Failed to load claims", err);
      } finally {
        setLoading(false);
      }
    }
    loadClaims();
  }, []);

  const filtered = claims.filter((c) => {
    const matchesSearch =
      c.claim_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.policy_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            My Claims
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Track autonomous AI claim investigations, evidence findings, and settlement disbursements
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Submit New Claim</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by claim number, title, or policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none transition-all shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "SUBMITTED", "IN_REVIEW", "UNDER_REVIEW", "APPROVED", "SETTLED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Loading claims...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <FileText className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No claims found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-5">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your filters or search terms."
              : "You have not filed any insurance claims yet. If an incident occurred, click below to start."}
          </p>
          <Link
            href="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit First Claim</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <div
              key={claim.id}
              className="rounded-2xl bg-white border border-[var(--border-subtle)] p-5 shadow-xs hover:border-[var(--green-300)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                    {claim.claim_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      claim.status === "SETTLED"
                        ? "bg-emerald-100 text-emerald-800"
                        : claim.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : claim.status === "UNDER_REVIEW" || claim.requires_human_review
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {claim.status}
                  </span>
                  {claim.requires_human_review && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      Human Review
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {claim.title}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Policy: <strong className="text-slate-800">{claim.policy_number}</strong> • Incident Date:{" "}
                  {claim.incident_date} • Location: {claim.incident_location || "N/A"}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)] shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Claim Amount
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    ₹{Number(claim.claim_amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/claims/${claim.id}/investigation`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-colors shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Investigation</span>
                  </Link>
                  <Link
                    href={`/claims/${claim.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-secondary)] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
