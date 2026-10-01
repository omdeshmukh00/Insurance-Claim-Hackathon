"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  FileCheck2,
  FileText,
  AlertTriangle,
  Bot,
  ArrowRight,
  Clock,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Search,
  Scale,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function LandingAndDashboardPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [policiesData, claimsData] = await Promise.all([
          api.listPolicies().catch(() => []),
          api.listClaims().catch(() => []),
        ]);
        setPolicies(Array.isArray(policiesData) ? policiesData : []);
        setClaims(Array.isArray(claimsData) ? claimsData : []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activePoliciesCount = policies.filter((p) => p.status === "ACTIVE").length;
  const pendingClaimsCount = claims.filter(
    (c) => c.status !== "SETTLED" && c.status !== "REJECTED"
  ).length;
  const claimsRequiringActionCount = claims.filter(
    (c) => c.requires_human_review || c.status === "REQUIRES_INFO"
  ).length;
  const totalSettledAmount = claims
    .filter((c) => c.status === "SETTLED")
    .reduce((sum, c) => sum + (Number(c.claim_amount) || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case "UNDER_INVESTIGATION":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">AI Investigating</span>;
      case "REQUIRES_INFO":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">Info Required</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Officer Review</span>;
      case "APPROVED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Approved</span>;
      case "SETTLED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200">Settled</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (With 'hero-section-img.png')
          ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123d12] via-[#175117] to-[#0d2b0d] text-white p-8 md:p-12 lg:p-14 shadow-2xl border border-emerald-900/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Copy, CTAs, Trust line */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Insurance Claims Intelligence</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Smarter Claims. <br />
                <span className="text-emerald-300">Clearer Decisions.</span>
              </h1>
              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-xl">
                Submit your claim, upload your documents, and let AI investigate the details — from policy coverage and missing information to inconsistencies and claim assessment — with every recommendation backed by evidence.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/claims/new"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-0.5"
              >
                <span>Start a Claim</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/policies"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-xs transition-all duration-150"
              >
                <FileCheck2 className="h-4 w-4 text-emerald-300" />
                <span>View My Policies</span>
              </Link>
            </div>

            {/* Trust Line */}
            <div className="pt-2 flex items-center gap-2 text-xs font-medium text-emerald-200/80">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Evidence-backed AI analysis • Human review when needed</span>
            </div>
          </div>

          {/* Right Column: hero-section-img visual integration */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl border border-emerald-400/25 bg-black/40 group">
              <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px]">
                <Image
                  src="/hero-section-img.png"
                  alt="InsuredYou Claims Intelligence Visual"
                  fill
                  priority
                  className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Overlay Glass Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                <span>6 Specialized AI Agents</span>
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/85 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-xs font-semibold shadow-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Grounded Evidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LIVE DASHBOARD METRICS BAR (Real Backend Values)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Portfolio & Claims Overview
            </h2>
            <p className="text-xs text-slate-500">
              Real-time synchronization with InsuredYou intelligence engine
            </p>
          </div>
          <Link
            href="/policies/upload"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>+ Add Existing Policy</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Policies */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Policies
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : activePoliciesCount}
              </span>
              <span className="text-xs text-slate-500">covered assets</span>
            </div>
          </div>

          {/* Pending Claims */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Claims
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : pendingClaimsCount}
              </span>
              <span className="text-xs text-slate-500">in investigation</span>
            </div>
          </div>

          {/* Claims Requiring Action */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Required
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : claimsRequiringActionCount}
              </span>
              <span className="text-xs text-slate-500">documents / review</span>
            </div>
          </div>

          {/* Total Settled */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Settled
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                ${loading ? "..." : totalSettledAmount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">disbursed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. HOW IT WORKS / CLAIMS PIPELINE
          ───────────────────────────────────────────────────────────── */}
      <section className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Autonomous Multi-Agent Architecture
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            How InsuredYou Investigates Every Claim
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Deterministic rule-checking combined with specialized generative models to eliminate processing delays while maintaining human oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="text-xs font-bold text-slate-900">Document Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Extracts loss facts, dates, damages & receipts with confidence scores.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="text-xs font-bold text-slate-900">Policy RAG Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Retrieves exact peril clauses, exclusions, waiting periods & limits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</div>
            <h3 className="text-xs font-bold text-slate-900">Coverage Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cross-references incident facts against contractual perils with citations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</div>
            <h3 className="text-xs font-bold text-slate-900">Anomaly Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Detects date or invoice variances objectively without premature labels.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">5</div>
            <h3 className="text-xs font-bold text-slate-900">Missing Info Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Identifies required police reports or estimates blocking determination.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold">6</div>
            <h3 className="text-xs font-bold text-slate-900">Assessment Agent</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Synthesizes findings into automated processing vs human officer review.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT CLAIMS & ACTIVE POLICIES SECTION
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Claims (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Claims</h2>
            <Link
              href="/claims"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All Claims</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading claims from InsuredYou backend...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">You haven't submitted a claim yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                File a new claim to experience autonomous multi-agent investigation and evidence-grounded adjudication.
              </p>
              <Link
                href="/claims/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <span>Start a Claim</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {claim.claim_number || "CLM-PENDING"}
                      </span>
                      {getStatusBadge(claim.status)}
                      <span className="text-[11px] uppercase font-bold text-slate-400">
                        {claim.claim_type || "AUTO"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{claim.title}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Incident: {claim.incident_date}</span>
                      <span>Amount: ${Number(claim.claim_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/claims/${claim.id}/investigation`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      <span>Live Investigation</span>
                    </Link>
                    <Link
                      href={`/claims/${claim.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Policies (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Policies</h2>
            <Link
              href="/policies"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              All Policies
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading policies...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
              <FileCheck2 className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">No policies registered</p>
              <Link
                href="/policies/upload"
                className="inline-block text-xs font-bold text-emerald-700 hover:underline"
              >
                + Upload Insurance Policy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.slice(0, 3).map((policy) => (
                <div
                  key={policy.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      {policy.insurer_name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {policy.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{policy.policy_name}</h4>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p>Policy #: <span className="font-mono text-slate-700">{policy.policy_number}</span></p>
                    <p>Deductible: ${Number(policy.deductible || 0).toLocaleString()}</p>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <Link
                      href={`/policies/${policy.id}`}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>View Coverage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/claims/new?policyNumber=${policy.policy_number}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      File Claim
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER ASSISTANT PROMPT BANNER
          ───────────────────────────────────────────────────────────── */}
      <section className="p-6 md:p-8 rounded-3xl bg-emerald-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center shrink-0">
            <Bot className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base font-bold">Have questions about your coverage or active claim?</h3>
            <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl">
              Our grounded Insurance AI Assistant can cross-reference your specific policy clauses, explain deductibles, or detail missing documents in seconds.
            </p>
          </div>
        </div>
        <Link
          href="/assistant"
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-emerald-950 hover:bg-emerald-50 transition-colors shrink-0 shadow-xs"
        >
          Ask AI Assistant
        </Link>
      </section>
    </div>
  );
}
