"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Calendar,
  DollarSign,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Bot,
  ExternalLink,
  ArrowLeft,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const policyId = resolvedParams.id;

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");

  useEffect(() => {
    async function loadPolicy() {
      try {
        setLoading(true);
        const data = await api.getPolicy(policyId);
        setPolicy(data);
      } catch (err: any) {
        setError(err.message || "Failed to load policy details");
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, [policyId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[var(--text-muted)]">
        Loading policy details...
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Policy Not Found
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {error || "The requested policy could not be found or you do not have permission to view it."}
        </p>
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Policies</span>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "OVERVIEW", label: "Overview" },
    { id: "COVERAGE", label: "Coverage" },
    { id: "LIMITS", label: "Limits" },
    { id: "EXCLUSIONS", label: "Exclusions" },
    { id: "DOCUMENTS", label: "Documents" },
    { id: "DATES", label: "Dates" },
    { id: "AI_INSIGHTS", label: "AI Insights", badge: "AI" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--green-700)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Policies</span>
        </Link>
        <Link
          href={`/claims/new?policy=${policy.policy_number}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors shadow-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Submit Claim for this Policy</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {policy.policy_type}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {policy.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
              {policy.policy_name}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Underwritten by <strong className="text-[var(--text-primary)]">{policy.insurer_name}</strong> • Policy No:{" "}
              <span className="font-mono font-semibold text-slate-800">{policy.policy_number}</span>
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)]">Annual Premium</span>
            <span className="text-xl font-extrabold text-emerald-700">
              ${Number(policy.premium || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Deductible: ${Number(policy.deductible || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-[var(--border-subtle)] flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-[var(--green-600)] text-[var(--green-700)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}

      {/* 1. OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Policy Contract Summary
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This {policy.policy_type} policy provides comprehensive loss indemnity issued to{" "}
                <strong>{policy.policyholder_name}</strong>. In the event of an insured incident,
                claims must be reported within standard policy notification timeframes.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)] text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Insured Asset / Person
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {policy.insured_asset || "Registered Vehicle / Specified Property"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Standard Deductible
                  </span>
                  <span className="font-semibold text-amber-700">
                    ${Number(policy.deductible || 0).toLocaleString()} per claim
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Coverage Highlights */}
            <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Covered Perils Preview
              </h3>
              <div className="flex flex-wrap gap-2">
                {(policy.coverage || []).map((cov: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>{cov}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Financial Schedule
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Annual Premium</span>
                  <span className="font-bold">${policy.premium}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Per-Incident Deductible</span>
                  <span className="font-bold text-amber-700">${policy.deductible}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Policyholder</span>
                  <span className="font-semibold">{policy.policyholder_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COVERAGE WITH EVIDENCE */}
      {activeTab === "COVERAGE" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Explicit Covered Perils & Events
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              {(policy.coverage || []).length} perils documented
            </span>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {(policy.coverage || []).map((item: string, idx: number) => (
              <div key={idx} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {item}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                      Covered
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] pl-6">
                    Subject to standard policy deductible of ${policy.deductible}.
                  </p>
                </div>
                <div className="text-right text-[10px] text-[var(--text-tertiary)] shrink-0">
                  <span className="font-medium block">Source: Policy Contract</span>
                  <span>Clause {idx + 1}.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LIMITS */}
      {activeTab === "LIMITS" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Declared Policy Limits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(policy.limits || []).map((limit: string, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1"
              >
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                  Limit Tier {idx + 1}
                </span>
                <p className="text-sm font-bold text-blue-950">{limit}</p>
                <p className="text-[11px] text-blue-700">
                  Maximum payout for qualified events under this schedule.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXCLUSIONS */}
      {activeTab === "EXCLUSIONS" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Policy Exclusions & Non-Covered Perils
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            The following perils are explicitly excluded from coverage under this policy schedule:
          </p>

          <div className="divide-y divide-[var(--border-subtle)]">
            {(policy.exclusions || []).map((exc: string, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="font-semibold text-slate-800">{exc}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold uppercase">
                  Excluded
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DOCUMENTS */}
      {activeTab === "DOCUMENTS" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Underlying Policy Documents
          </h3>
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-700" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">
                  {policy.policy_number}_policy_schedule.pdf
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Uploaded & verified via Policy Document Agent
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              Verified
            </span>
          </div>
        </div>
      )}

      {/* 6. IMPORTANT DATES */}
      {activeTab === "DATES" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Policy Schedule Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                Inception / Start Date
              </span>
              <span className="text-base font-bold text-[var(--text-primary)] mt-1 block">
                {policy.start_date}
              </span>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                Coverage commenced at 00:01 Standard Time.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                Expiry / Renewal Date
              </span>
              <span className="text-base font-bold text-amber-700 mt-1 block">
                {policy.expiry_date}
              </span>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                Policy renewal due before expiration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. AI INSIGHTS */}
      {activeTab === "AI_INSIGHTS" && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span>AI Policy Understanding (Agent 2 - RAG Engine)</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            This policy is indexed into the RAG vector engine. When filing claims, incoming damage assessments and incident reports are evaluated autonomously against these verified terms.
          </p>

          <div className="p-4 rounded-xl bg-white border border-emerald-200/60 shadow-xs space-y-3">
            <p className="text-xs font-bold text-slate-800">
              Ask AI about this specific policy:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/assistant?q=${encodeURIComponent(`Is accidental collision covered under policy ${policy.policy_number}?`)}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                "Is collision covered?"
              </Link>
              <Link
                href={`/assistant?q=${encodeURIComponent(`What is my deductible under ${policy.policy_number}?`)}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                "What is my deductible?"
              </Link>
              <Link
                href={`/assistant?q=${encodeURIComponent(`What perils are excluded in policy ${policy.policy_number}?`)}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                "What is excluded?"
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
