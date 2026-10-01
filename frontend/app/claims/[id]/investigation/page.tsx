"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  FileCheck2,
  Scale,
  Shield,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";

interface PipelineStage {
  id: string;
  name: string;
  agentName: string;
  status: "completed" | "running" | "pending" | "warning";
  summary: string;
  findingsCount?: number;
}

export default function ClaimInvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;

  const [claim, setClaim] = useState<any>(null);
  const [investigation, setInvestigation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimData, invData] = await Promise.all([
        api.getClaim(claimId),
        api.getInvestigation(claimId).catch(() => null),
      ]);
      setClaim(claimData);
      setInvestigation(invData);
    } catch (err: any) {
      setError(err.message || "Failed to load investigation state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [claimId]);

  const handleTriggerInvestigation = async () => {
    try {
      setRunningAgent(true);
      setError(null);
      await api.triggerInvestigation(claimId);
      // reload after completion
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to execute AI investigation pipeline");
    } finally {
      setRunningAgent(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[var(--text-muted)]">
        Loading AI multi-agent investigation pipeline...
      </div>
    );
  }

  const agentRuns = investigation?.agentRuns || [];
  const findings = investigation?.findings || [];
  const anomalies = investigation?.anomalies || [];
  const missingInfo = investigation?.missingInformation || [];
  const assessment = investigation?.assessment;

  const getAgentStatus = (agentName: string) => {
    const run = agentRuns.find(
      (r: any) => r.agent_name?.toLowerCase() === agentName.toLowerCase()
    );
    if (!run) return "pending";
    if (run.status === "COMPLETED") return "completed";
    if (run.status === "RUNNING") return "running";
    return "warning";
  };

  const stages: PipelineStage[] = [
    {
      id: "DOC",
      name: "Document",
      agentName: "ClaimDocumentAgent",
      status: getAgentStatus("ClaimDocumentAgent") as any,
      summary: "Multimodal extraction of incident facts, damaged items, and metadata.",
    },
    {
      id: "POLICY",
      name: "Policy",
      agentName: "PolicyAgent",
      status: getAgentStatus("PolicyAgent") as any,
      summary: "RAG retrieval of applicable contract clauses, waiting periods, and limits.",
    },
    {
      id: "COVERAGE",
      name: "Coverage",
      agentName: "CoverageAgent",
      status: getAgentStatus("CoverageAgent") as any,
      summary: "Compares claim facts against covered perils and policy conditions.",
    },
    {
      id: "ANOMALY",
      name: "Anomaly",
      agentName: "AnomalyAgent",
      status: (anomalies.length > 0 ? "warning" : getAgentStatus("AnomalyAgent")) as any,
      summary: "Consistency checking across documents for potential timeline or invoice mismatches.",
      findingsCount: anomalies.length,
    },
    {
      id: "MISSING",
      name: "Missing Information",
      agentName: "MissingInformationAgent",
      status: (missingInfo.length > 0 ? "warning" : getAgentStatus("MissingInformationAgent")) as any,
      summary: "Evaluates completeness of proof of loss, repair receipts, and reports.",
      findingsCount: missingInfo.length,
    },
    {
      id: "ASSESSMENT",
      name: "Assessment",
      agentName: "AssessmentAgent",
      status: getAgentStatus("AssessmentAgent") as any,
      summary: "Synthesizes agent outputs to classify claim complexity and routing path.",
    },
    {
      id: "REVIEW",
      name: "Human Review",
      agentName: "HumanReviewGate",
      status: (claim?.requires_human_review || assessment?.recommendation === "human_review"
        ? "warning"
        : "completed") as any,
      summary: claim?.requires_human_review
        ? "Assigned for staff adjuster review due to anomalies or complex clauses."
        : "Eligible for automated processing.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--green-700)] mb-1">
            <Link href={`/claims/${claimId}`} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Claim {claim?.claim_number}</span>
            </Link>
            <span>/</span>
            <span>AI Investigation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Autonomous AI Claim Investigation
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Visual multi-agent orchestration pipeline analyzing policy coverage, document consistency, and evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/claims/${claimId}/evidence`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-secondary)] transition-colors shadow-2xs"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Evidence Vault</span>
          </Link>

          <button
            onClick={handleTriggerInvestigation}
            disabled={runningAgent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {runningAgent ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Run AI Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* PIPELINE VISUAL TRACKER (Document → Policy → Coverage → Anomaly → Missing Information → Assessment → Human Review) */}
      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Agent Orchestration Workflow
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Decoupled Express + Gemini Backend
          </span>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isWarning = stage.status === "warning";
            const isRunning = stage.status === "running";

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between ${
                  isCompleted
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                    : isWarning
                    ? "bg-amber-50/70 border-amber-300 text-amber-950"
                    : isRunning
                    ? "bg-blue-50 border-blue-300 text-blue-950 animate-pulse"
                    : "bg-[var(--bg-subtle)]/50 border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-center mb-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                    {stage.name}
                  </span>
                </div>

                <div className="mt-2 pt-1 border-t border-black/5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isCompleted
                        ? "bg-emerald-200 text-emerald-900"
                        : isWarning
                        ? "bg-amber-200 text-amber-900"
                        : isRunning
                        ? "bg-blue-200 text-blue-900"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isWarning && stage.id === "REVIEW"
                      ? "Required"
                      : isWarning
                      ? "Flagged"
                      : isCompleted
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AGENT FINDINGS & ANOMALIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assessment & Anomalies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Card */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Claim Assessment Agent Synthesis
                </h3>
              </div>
              {assessment && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    assessment.recommendation === "automated_processing"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {assessment.recommendation === "automated_processing"
                    ? "Automated Processing"
                    : "Human Review Required"}
                </span>
              )}
            </div>

            {assessment ? (
              <div className="space-y-4 text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-subtle)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  {assessment.summary}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Complexity Classification
                    </span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {assessment.complexity || "Standard"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Evidence Count
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {(assessment.evidence_ids || []).length} Verified Citations
                    </span>
                  </div>
                </div>

                {assessment.reasons && assessment.reasons.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">
                      Key Rationales:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {assessment.reasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                AI Assessment has not run yet. Click "Run AI Investigation" above to evaluate.
              </p>
            )}
          </div>

          {/* Anomaly / Consistency Agent Output */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Consistency & Anomaly Detection
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Objective cross-document corroboration
              </span>
            </div>

            {anomalies.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  No inconsistencies or anomalies detected across submitted loss documentation.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anom: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 uppercase text-[10px]">
                        {anom.type || "Potential Inconsistency"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold">
                        Requires Verification
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium">{anom.finding || anom.description}</p>
                    {anom.evidence_ids && (
                      <p className="text-[10px] text-amber-800/80 pt-1">
                        Correlated to {anom.evidence_ids.length} document record(s).
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Missing Information Checklist & Settlement Link */}
        <div className="space-y-6">
          {/* Missing Information Agent Output */}
          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>Missing Information Agent</span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Items required to complete investigation:
            </p>

            {missingInfo.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                All mandatory claim documentation verified.
              </div>
            ) : (
              <div className="space-y-2.5">
                {missingInfo.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">
                        {item.required_item || item.item}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                        {item.priority || "HIGH"}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement Recommendation Agent */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Scale className="h-4 w-4 text-amber-700" />
              <span>Settlement Recommendation</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              When all evidence is verified, the settlement agent prepares the mathematical indemnity recommendation for authorized disbursement.
            </p>
            <Link
              href={`/claims/${claimId}/settlement`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-2xs"
            >
              <span>View Settlement Breakdown</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
