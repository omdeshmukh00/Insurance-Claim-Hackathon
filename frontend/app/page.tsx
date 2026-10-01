"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Bot,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [policiesData, claimsData] = await Promise.all([
          api.listPolicies().catch(() => []),
          api.listClaims().catch(() => []),
        ]);
        setPolicies(policiesData || []);
        setClaims(claimsData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const activePolicies = policies.filter((p) => p.status === "ACTIVE");
  const pendingClaims = claims.filter(
    (c) => c.status === "SUBMITTED" || c.status === "IN_REVIEW" || c.status === "UNDER_REVIEW"
  );
  const claimsRequiringAction = claims.filter(
    (c) => c.requires_human_review || c.status === "UNDER_REVIEW"
  );
  const settledClaims = claims.filter((c) => c.status === "SETTLED");
  const totalSettledAmount = settledClaims.reduce(
    (acc, c) => acc + (c.claim_amount || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-emerald-400/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            AI Claims Intelligence Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user.fullName || "Policyholder"}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Manage your verified policies, track automated AI claim investigations in real time, and ask your grounded policy assistant anything.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/policies/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4 text-emerald-700" />
              <span>Add Existing Policy</span>
            </Link>
            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Submit New Claim</span>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700/60 border border-emerald-400/30 text-white font-medium text-xs hover:bg-emerald-700 transition-colors"
            >
              <Bot className="h-4 w-4 text-emerald-300" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Policies */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Active Policies
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {loading ? "..." : activePolicies.length}
            </p>
            <Link
              href="/policies"
              className="inline-flex items-center gap-1 text-xs text-[var(--green-700)] hover:underline mt-2 font-medium"
            >
              <span>View policies</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FileCheck2 className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Claims */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Pending Claims
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {loading ? "..." : pendingClaims.length}
            </p>
            <Link
              href="/claims"
              className="inline-flex items-center gap-1 text-xs text-[var(--green-700)] hover:underline mt-2 font-medium"
            >
              <span>Track progress</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Claims Requiring Action */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Action Required
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {loading ? "..." : claimsRequiringAction.length}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              {claimsRequiringAction.length > 0 ? "Staff review / items" : "All up to date"}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Settlement Status */}
        <div className="p-5 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Total Settled
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              ${loading ? "..." : totalSettledAmount.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              {settledClaims.length} claim(s) disbursed
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Claims & AI Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Claims Card */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  My Claims
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Active filings undergoing autonomous multi-agent verification
                </p>
              </div>
              <Link
                href="/claims/new"
                className="text-xs font-semibold text-[var(--green-700)] hover:text-[var(--green-800)] flex items-center gap-1"
              >
                <span>File Claim</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Loading claims...
              </div>
            ) : claims.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-[var(--bg-subtle)]/50 border border-dashed border-[var(--border-default)]">
                <FileText className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No claims submitted yet</p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-4">
                  When you experience an incident, submit a claim here to trigger immediate AI verification and policy correlation.
                </p>
                <Link
                  href="/claims/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green-600)] text-white text-xs font-medium hover:bg-[var(--green-700)] transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Start Claim</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {claims.slice(0, 4).map((claim) => (
                  <div
                    key={claim.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-subtle)]/40 px-3 -mx-3 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {claim.claim_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                        {claim.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Policy: {claim.policy_number} • Incident Date: {claim.incident_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">Amount</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                          ${Number(claim.claim_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        href={`/claims/${claim.id}/investigation`}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--green-500)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--green-700)] transition-colors flex items-center gap-1"
                      >
                        <span>Investigation</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Active Policies Preview */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  My Active Policies
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Insurance contracts currently indexed for coverage analysis
                </p>
              </div>
              <Link
                href="/policies"
                className="text-xs font-semibold text-[var(--green-700)] hover:text-[var(--green-800)] flex items-center gap-1"
              >
                <span>All Policies</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Loading policies...
              </div>
            ) : policies.length === 0 ? (
              <div className="py-8 text-center rounded-xl bg-[var(--bg-subtle)]/50 border border-dashed border-[var(--border-default)]">
                <FileCheck2 className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No policies linked yet</p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-4">
                  Upload your existing insurance policy PDF or image to extract coverage terms automatically.
                </p>
                <Link
                  href="/policies/upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green-600)] text-white text-xs font-medium hover:bg-[var(--green-700)] transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Upload Policy</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {policies.map((p) => (
                  <Link
                    key={p.id}
                    href={`/policies/${p.id}`}
                    className="group block p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--green-300)] hover:bg-[var(--green-50)]/30 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {p.policy_type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Ded: ${p.deductible}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mt-2 group-hover:text-[var(--green-700)] transition-colors">
                      {p.policy_name}
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {p.insurer_name} • {p.policy_number}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Expires {p.expiry_date}</span>
                      <span className="font-semibold text-emerald-700">
                        ${p.premium}/yr
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: AI Assistant Agent Mode CTA & Quick Actions */}
        <div className="space-y-6">
          {/* Agent Mode Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/30 border border-emerald-200/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <Bot className="h-5 w-5 text-emerald-600" />
              <span>Grounded AI Assistant</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Ask questions about your real insurance coverage. The AI agent retrieves exact policy clauses and verifiable evidence.
            </p>

            <div className="space-y-2 mb-5">
              {[
                "Is my car accident covered?",
                "What is my deductible?",
                "What documents are missing?",
              ].map((query, idx) => (
                <Link
                  key={idx}
                  href={`/assistant?q=${encodeURIComponent(query)}`}
                  className="block text-xs font-medium text-emerald-900 bg-white/80 hover:bg-white px-3 py-2 rounded-lg border border-emerald-200/60 shadow-xs transition-colors"
                >
                  "{query}"
                </Link>
              ))}
            </div>

            <Link
              href="/assistant"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Bot className="h-4 w-4" />
              <span>Open AI Assistant</span>
            </Link>
          </div>

          {/* Multi-Agent Architecture Overview */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
              Investigation Pipeline
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Autonomous agents collaborate to evaluate each submitted claim:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Policy Document Agent:</strong> Extracts limits & clauses</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Coverage Agent:</strong> Evaluates claim against perils</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Anomaly Agent:</strong> Flags objective inconsistencies</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Missing Info Agent:</strong> Itemizes required items</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Assessment Agent:</strong> Synthesizes routing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
