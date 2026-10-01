"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FolderOpen,
  ArrowLeft,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Quote,
  Shield,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClaimEvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;

  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [claimData, evData] = await Promise.all([
          api.getClaim(claimId),
          api.getEvidence(claimId),
        ]);
        setClaim(claimData);
        setEvidenceList(evData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load evidence vault");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [claimId]);

  const filtered = evidenceList.filter((ev) => {
    const matchesSearch =
      ev.source_text?.toLowerCase().includes(search.toLowerCase()) ||
      ev.evidence_type?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "ALL" || ev.evidence_type === selectedType;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(evidenceList.map((e) => e.evidence_type).filter(Boolean)));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--green-700)] mb-1">
          <Link href={`/claims/${claimId}`} className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Claim {claim?.claim_number}</span>
          </Link>
          <span>/</span>
          <span>Evidence Vault</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Corroborated Evidence Vault
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Verifiable citations, quotes, page references, and OCR extractions collected by AI agents.
            </p>
          </div>
          <Link
            href={`/claims/${claimId}/investigation`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-secondary)] transition-colors self-start sm:self-auto"
          >
            <span>View Investigation Pipeline</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search source quotes or citations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
              selectedType === "ALL"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            ALL ({evidenceList.length})
          </button>
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                selectedType === type
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Cards List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)]">
          Retrieving evidence citations...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <FolderOpen className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            No Evidence Citations Found
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-5">
            Run the AI investigation pipeline to extract citations from your policy documents and damage reports.
          </p>
          <Link
            href={`/claims/${claimId}/investigation`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--green-600)] text-white text-xs font-semibold shadow-xs"
          >
            <span>Go to AI Investigation</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs hover:border-[var(--green-300)] transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {ev.evidence_type || "DOCUMENT_EXCERPT"}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID: {ev.id.slice(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>Page: <strong className="text-slate-800">{ev.page_number || 1}</strong></span>
                  <span>•</span>
                  <span>Confidence: <strong className="text-emerald-700">{Math.round((ev.confidence_score || 0.95) * 100)}%</strong></span>
                </div>
              </div>

              {/* Source Quote */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] text-xs text-slate-800 font-serif leading-relaxed italic flex items-start gap-3">
                <Quote className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5 not-italic" />
                <p>"{ev.source_text}"</p>
              </div>

              {/* Metadata row */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] pt-1">
                <span>
                  Correlated to Document ID: <span className="font-mono">{ev.document_id ? ev.document_id.slice(0, 8) : 'Policy Schedule'}</span>
                </span>
                <span>Captured: {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
