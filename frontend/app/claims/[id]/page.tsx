"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Calendar,
  MapPin,
  UploadCloud,
  FileCheck2,
  FolderOpen,
  Scale,
  Shield,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;

  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadClaim() {
      try {
        setLoading(true);
        const data = await api.getClaim(claimId);
        setClaim(data);
      } catch (err: any) {
        setError(err.message || "Failed to load claim details");
      } finally {
        setLoading(false);
      }
    }
    loadClaim();
  }, [claimId]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setUploadingDoc(true);
        setUploadSuccess(false);
        await api.uploadClaimDocument(claimId, file, "SUPPLEMENTARY_DOCUMENT");
        setUploadSuccess(true);
        // Refresh claim details
        const updated = await api.getClaim(claimId);
        setClaim(updated);
      } catch (err: any) {
        alert(err.message || "Failed to upload document");
      } finally {
        setUploadingDoc(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[var(--text-muted)]">
        Loading claim details...
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-[var(--text-primary)]">Claim Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {error || "Could not retrieve claim details."}
        </p>
        <Link
          href="/claims"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Claims</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/claims"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--green-700)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>My Claims</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/claims/${claimId}/investigation`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Investigation Live</span>
          </Link>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800">
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
                  Assigned for Human Review
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
              {claim.title}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Policy: <strong className="text-slate-800 font-mono">{claim.policy_number}</strong> • Incident Date:{" "}
              <strong>{claim.incident_date}</strong> • Location: <strong>{claim.incident_location || "N/A"}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block">
              Claim Amount
            </span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              ${Number(claim.claim_amount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <Link
            href={`/claims/${claimId}/investigation`}
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-xs font-semibold text-emerald-900 flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>AI Investigation Tracker</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-700" />
          </Link>

          <Link
            href={`/claims/${claimId}/evidence`}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-4 w-4 text-slate-600" />
              <span>Supporting Evidence Vault</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            href={`/claims/${claimId}/settlement`}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-xs font-semibold text-amber-900 flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Scale className="h-4 w-4 text-amber-700" />
              <span>Settlement Status</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {/* Incident Description and Facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Incident Description
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {claim.description}
            </p>
          </div>

          {/* Upload Additional Documents */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Upload Supporting Documents
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              If our missing information agent requested additional documents, upload repair bills or police reports here.
            </p>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs">
                <UploadCloud className="h-4 w-4" />
                <span>{uploadingDoc ? "Uploading..." : "Select Document / Image"}</span>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
              {uploadSuccess && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Document uploaded and queued for agent extraction
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Claim Facts Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Claim Schedule Facts
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Policy</span>
                <span className="font-mono font-semibold">{claim.policy_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Incident Date</span>
                <span className="font-semibold">{claim.incident_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Claim Amount</span>
                <span className="font-bold">${claim.claim_amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Human Review</span>
                <span className="font-semibold">
                  {claim.requires_human_review ? "Flagged Required" : "Automated Queue"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
