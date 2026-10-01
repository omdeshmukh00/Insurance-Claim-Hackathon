"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  PlusCircle,
  Search,
  Shield,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        const data = await api.listPolicies();
        setPolicies(data || []);
      } catch (err) {
        console.error("Error loading policies", err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const filtered = policies.filter((p) => {
    const matchesSearch =
      p.policy_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.policy_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.insurer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || p.policy_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            My Insurance Policies
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Active policies analyzed by InsuredYou AI for autonomous claim coverage matching
          </p>
        </div>
        <Link
          href="/policies/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Existing Policy</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by policy number, insurer, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none transition-all shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "AUTO", "HEALTH", "PROPERTY", "LIFE"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                filterType === type
                  ? "bg-emerald-800 text-white border-emerald-800"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Policy List Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Loading insurance policies...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <FileCheck2 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No policies found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-5">
            {search || filterType !== "ALL"
              ? "Try adjusting your search filters or add a new policy."
              : "Upload your current insurance policy PDF or image to enable automated claim coverage verification."}
          </p>
          <Link
            href="/policies/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--green-600)] text-white text-xs font-semibold hover:bg-[var(--green-700)] transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Upload Policy Document</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl bg-white border border-[var(--border-subtle)] p-5 shadow-xs hover:border-[var(--green-300)] hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Type and Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {policy.policy_type}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {policy.status}
                  </span>
                </div>

                {/* Policy Name & Number */}
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-3 line-clamp-1">
                  {policy.policy_name}
                </h3>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
                  {policy.insurer_name} • <span className="font-mono">{policy.policy_number}</span>
                </p>

                {/* Coverage Summary Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(policy.coverage || []).slice(0, 3).map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      {item}
                    </span>
                  ))}
                  {(policy.coverage || []).length > 3 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
                      +{policy.coverage.length - 3} more
                    </span>
                  )}
                </div>

                {/* Financial Overview */}
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Deductible
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      ₹{Number(policy.deductible || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Premium
                    </span>
                    <span className="font-bold text-emerald-700">
                      ₹{Number(policy.premium || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Valid until {policy.expiry_date}
                </span>
                <Link
                  href={`/policies/${policy.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--green-700)] hover:text-[var(--green-800)]"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
