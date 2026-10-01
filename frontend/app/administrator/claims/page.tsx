"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewOnly, setReviewOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.listAdminClaims();
        setClaims(data || []);
      } catch (err) {
        console.error("Failed to load claims", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = claims.filter((c) => {
    const matchesSearch =
      c.claim_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.policy_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesReview = !reviewOnly || c.requires_human_review || c.status === "UNDER_REVIEW";
    return matchesSearch && matchesStatus && matchesReview;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Master Claims Queue
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Operational overview of all submitted filings across policyholders with AI assessment triage.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by claim number, title, or policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white border border-[var(--border-subtle)] focus:border-amber-500 outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setReviewOnly(!reviewOnly)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors shrink-0 ${
              reviewOnly
                ? "bg-amber-500 text-slate-950 border-amber-500"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Human Review Only</span>
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold rounded-xl bg-white border border-[var(--border-subtle)] outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="SETTLED">SETTLED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)]">
          Loading master claims...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <FileText className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-sm font-bold text-[var(--text-primary)]">No claims match the active filters</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Incident Details</th>
                <th className="py-3 px-4">Policy Code</th>
                <th className="py-3 px-4">Loss Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Review Gate</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {claim.claim_number}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{claim.title}</p>
                    <p className="text-[11px] text-slate-500">{claim.incident_date}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {claim.policy_number}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ${Number(claim.claim_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                  </td>
                  <td className="py-3 px-4">
                    {claim.requires_human_review ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        <AlertTriangle className="h-3 w-3 text-amber-700" />
                        Human Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Automated Path
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/administrator/claims/${claim.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors shadow-2xs"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
