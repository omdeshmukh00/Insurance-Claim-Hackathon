"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Scale,
  FolderOpen,
  DollarSign,
  HelpCircle,
  Clock,
  Sparkles,
  UserCheck,
  Send,
  X,
  FileText,
  AlertCircle,
  Quote,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;

  const [claimDetail, setClaimDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Decision Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<
    "APPROVE_FOR_PROCESSING" | "REQUEST_INFORMATION" | "ESCALATE" | "REJECT"
  >("APPROVE_FOR_PROCESSING");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Settlement Modal State
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [deductibleApplied, setDeductibleApplied] = useState<number>(500);
  const [settleNotes, setSettleNotes] = useState("");
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminClaimDetail(claimId);
      setClaimDetail(data);

      const claimAmt = Number(data.claim?.claim_amount || 0);
      setSettlementAmount(claimAmt);
    } catch (err: any) {
      setError(err.message || "Failed to load claim detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [claimId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      await api.submitAdminReview(claimId, {
        decision: reviewDecision,
        notes: reviewNotes.trim() || `Adjudicator decision: ${reviewDecision}`,
      });
      setActionSuccess(`Review decision logged: ${reviewDecision}`);
      setShowReviewModal(false);
      setReviewNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingSettlement(true);
      const netPayout = Math.max(0, settlementAmount - deductibleApplied);

      await api.settleAdminClaim(claimId, {
        settlement_amount: Number(settlementAmount),
        deductible_applied: Number(deductibleApplied),
        net_payout: netPayout,
        notes: settleNotes.trim() || "Authorized settlement disbursement executed by operations officer.",
      });

      setActionSuccess(`Claim settled for $${netPayout.toLocaleString()} net payout!`);
      setShowSettleModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to settle claim");
    } finally {
      setSubmittingSettlement(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[var(--text-muted)]">
        Loading operational claim inspection console...
      </div>
    );
  }

  if (error || !claimDetail?.claim) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Claim Not Found</h2>
        <p className="text-xs text-slate-500">{error || "Could not retrieve claim."}</p>
        <Link
          href="/administrator/claims"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Claims Queue</span>
        </Link>
      </div>
    );
  }

  const claim = claimDetail.claim;
  const findings = claimDetail.findings || [];
  const evidence = claimDetail.evidence || [];
  const reviews = claimDetail.reviews || [];
  const settlement = claimDetail.settlement;
  const auditLogs = claimDetail.auditLogs || [];

  const anomalies = findings.filter(
    (f: any) =>
      f.finding_type?.toLowerCase().includes("anomaly") ||
      f.finding_type?.toLowerCase().includes("inconsistency") ||
      f.finding_type?.toLowerCase().includes("mismatch")
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
            <Link href="/administrator/claims" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Master Claims</span>
            </Link>
            <span>/</span>
            <span>Inspection Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Claim Inspection: <span className="font-mono">{claim.claim_number}</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Policy Code: <strong className="text-slate-800">{claim.policy_number}</strong> • Incident Date:{" "}
            {claim.incident_date}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            <span>Human Review Decision</span>
          </button>

          {claim.status !== "SETTLED" && (
            <button
              onClick={() => setShowSettleModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Scale className="h-4 w-4" />
              <span>Authorize Settlement</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
            Status
          </span>
          <span
            className={`inline-block mt-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
              claim.status === "SETTLED"
                ? "bg-emerald-100 text-emerald-800"
                : claim.status === "APPROVED"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {claim.status}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
            Claim Amount
          </span>
          <span className="text-base font-bold text-slate-900 mt-1 block">
            ${Number(claim.claim_amount || 0).toLocaleString()}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
            Review Gate
          </span>
          <span className="font-bold text-amber-800 mt-1 block">
            {claim.requires_human_review ? "Flagged Required" : "Automated Queue"}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
            Evidence Citations
          </span>
          <span className="font-bold text-emerald-700 mt-1 block">
            {evidence.length} Record(s) Correlated
          </span>
        </div>
      </div>

      {/* Incident Description */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Incident Narrative & Loss Description
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-[var(--bg-subtle)] p-4 rounded-xl border border-[var(--border-subtle)]">
          {claim.description}
        </p>
      </div>

      {/* Anomalies & Consistency Inspector */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Anomaly & Consistency Findings (Objective Verification)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {anomalies.length} anomaly flag(s)
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            No contradictions or timeline mismatches detected.
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anom: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 uppercase text-[10px]">
                    {anom.finding_type || "Potential Inconsistency"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold">
                    Requires Verification
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{anom.description || anom.finding}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corroborated Evidence Graph Excerpts */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Verifiable Evidence Package
            </h3>
          </div>
          <span className="text-xs text-slate-500">{evidence.length} total evidence entries</span>
        </div>

        {evidence.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No evidence records currently attached.</p>
        ) : (
          <div className="space-y-3">
            {evidence.slice(0, 5).map((ev: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold uppercase text-emerald-800">
                    {ev.evidence_type || "EXCERPT"}
                  </span>
                  <span>Page {ev.page_number || 1} • Confidence: {Math.round((ev.confidence_score || 0.95) * 100)}%</span>
                </div>
                <p className="font-serif italic text-slate-800 text-[11px]">
                  "{ev.source_text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review History */}
      {reviews.length > 0 && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Adjudication & Review Decisions
          </h3>
          <div className="divide-y divide-[var(--border-subtle)]">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rev.decision}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rev.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600">{rev.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Human Review Decision */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Log Human Review Decision
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adjudication Decision
                </label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none"
                >
                  <option value="APPROVE_FOR_PROCESSING">APPROVE_FOR_PROCESSING</option>
                  <option value="REQUEST_INFORMATION">REQUEST_INFORMATION</option>
                  <option value="ESCALATE">ESCALATE</option>
                  <option value="REJECT">REJECT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Review Notes & Instructions
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain rationale for this decision..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer"
                >
                  {submittingReview ? "Logging..." : "Submit Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Authorize Settlement */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Authorize Claim Settlement
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Claim Ref: {claim.claim_number}
                </p>
              </div>
              <button onClick={() => setShowSettleModal(false)} className="text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Approved Gross Claim Loss ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Policy Deductible to Deduct ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={deductibleApplied}
                  onChange={(e) => setDeductibleApplied(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none text-amber-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="text-emerald-800 block text-[10px] font-bold uppercase">
                  Net Disbursement Payout
                </span>
                <span className="text-base font-extrabold text-emerald-900">
                  ${Math.max(0, settlementAmount - deductibleApplied).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Settlement & Payout Notes
                </label>
                <textarea
                  rows={2}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Notes accompanying settlement disbursement..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSettlement}
                  className="px-5 py-2 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white font-bold shadow-xs cursor-pointer"
                >
                  {submittingSettlement ? "Disbursing..." : "Authorize Settlement & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
