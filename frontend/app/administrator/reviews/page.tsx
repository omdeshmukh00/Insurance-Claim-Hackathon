"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminReviewsQueuePage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      try {
        setLoading(true);
        const data = await api.listAdminClaims({ requires_review: true });
        setClaims(data || []);
      } catch (err) {
        console.error("Failed to load review queue", err);
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
          <Link href="/administrator" className="hover:underline">
            Dashboard
          </Link>
          <span>/</span>
          <span>Review Queue</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Human Review Triage Queue
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Filings flagged by Anomaly Detection or Assessment Agent requiring adjudicator intervention.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)]">
          Loading review queue...
        </div>
      ) : claims.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 mt-1">
            No claims currently require human intervention or special review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-2xl bg-white border border-amber-200/80 p-6 shadow-xs hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {claim.claim_number}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                    <AlertTriangle className="h-3 w-3 text-amber-700" />
                    Human Review Flagged
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{claim.title}</h3>
                <p className="text-xs text-slate-500">
                  Policy: <strong className="text-slate-800 font-mono">{claim.policy_number}</strong> • Incident Date:{" "}
                  {claim.incident_date} • Loss: <strong>${Number(claim.claim_amount || 0).toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/administrator/claims/${claim.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Inspect & Adjudicate</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
