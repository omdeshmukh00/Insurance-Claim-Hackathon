"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileCheck2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClaimSettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;

  const [claim, setClaim] = useState<any>(null);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettlement() {
      try {
        setLoading(true);
        const [claimRes, setRes] = await fetchStateData();
        setClaim(claimRes);
        setSettlementData(setRes);
      } catch (err: any) {
        setError(err.message || "Failed to load settlement details");
      } finally {
        setLoading(false);
      }
    }

    async function fetchStateData() {
      const c = await api.getClaim(claimId);
      const s = await api.getSettlement(claimId).catch(() => ({ claim: c, settlement: null, recommendation: null }));
      return [c, s];
    }

    loadSettlement();
  }, [claimId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[var(--text-muted)]">
        Loading settlement disbursement status...
      </div>
    );
  }

  const claimInfo = settlementData?.claim || claim;
  const settlement = settlementData?.settlement;
  const recommendation = settlementData?.recommendation;

  const claimAmount = Number(claimInfo?.claim_amount || 0);
  const deductibleApplied = Number(settlement?.deductible_applied || recommendation?.deductible || 500);
  const recommendedAmount = Number(recommendation?.recommended_amount || Math.max(0, claimAmount - deductibleApplied));
  const finalSettlementAmount = Number(settlement?.settlement_amount || (claimInfo?.status === "SETTLED" ? recommendedAmount : 0));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--green-700)] mb-1">
          <Link href={`/claims/${claimId}`} className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Claim {claimInfo?.claim_number}</span>
          </Link>
          <span>/</span>
          <span>Settlement</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Claim Settlement & Indemnity
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          AI recommendation engine loss calculation, policy deductible application, and authorized disbursement.
        </p>
      </div>

      {/* Settlement Status Card */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Claim Ref: {claimInfo?.claim_number}
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {settlement ? "Settlement Disbursed" : "Settlement Under Assessment"}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Policy: {claimInfo?.policy_number}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                settlement || claimInfo?.status === "SETTLED"
                  ? "bg-emerald-100 text-emerald-800"
                  : claimInfo?.status === "APPROVED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{settlement ? "SETTLED" : claimInfo?.status || "PENDING"}</span>
            </span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] p-5 space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--text-secondary)]">Total Claimed Loss Amount:</span>
            <span className="font-bold text-[var(--text-primary)]">
              ₹{claimAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)] text-amber-800">
            <span>Standard Policy Deductible Applied:</span>
            <span className="font-bold">
              - ₹{deductibleApplied.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between py-2 text-sm font-extrabold text-emerald-800 border-t border-[var(--border-default)]">
            <span>Net Indemnity Disbursed / Recommended:</span>
            <span>
              ₹{(settlement ? finalSettlementAmount : recommendedAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* AI Settlement Recommendation Notes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>AI Settlement Recommendation Agent</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-white p-4 rounded-xl border border-[var(--border-subtle)]">
            {settlement?.notes ||
              recommendation?.explanation ||
              "Calculated based on verified repair quotes and itemized policy liability limits. Subject to authorized administrator disbursement rules."}
          </p>
        </div>

        {/* Authorized Approver Info if Settled */}
        {settlement && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold">Disbursement Authorized by Claims Officer</p>
            <p className="text-[11px] text-emerald-800">
              Payment reference logged in database audit trail. A confirmation notice was dispatched to your email address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
