"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  UserCheck,
  DollarSign,
  RefreshCw,
  Loader2,
  FileSearch,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Badge,
} from "@/components/ui";
import {
  api,
  BackendClaim,
  BackendDocument,
  BackendClaimEvent,
  BackendEvidence,
  BackendAssessment,
  BackendInvestigationSummary,
  BackendReviewDecision,
  BackendSettlement,
  BackendAuditLog,
} from "@/lib/api";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminClaimWorkspacePage() {
  const params = useParams();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<BackendClaim | null>(null);
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [events, setEvents] = useState<BackendClaimEvent[]>([]);
  const [evidence, setEvidence] = useState<BackendEvidence[]>([]);
  const [assessment, setAssessment] = useState<BackendAssessment | null>(null);
  const [investigation, setInvestigation] =
    useState<BackendInvestigationSummary | null>(null);
  const [reviews, setReviews] = useState<BackendReviewDecision[]>([]);
  const [settlement, setSettlement] = useState<BackendSettlement | null>(null);
  const [auditLogs, setAuditLogs] = useState<BackendAuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "investigation" | "coverage" | "evidence" | "review" | "audit"
  >("overview");

  // Actions states
  const [isTriggeringInvestigation, setIsTriggeringInvestigation] =
    useState(false);
  const [reviewDecision, setReviewDecision] = useState<
    "APPROVE_FOR_PROCESSING" | "REQUEST_INFORMATION" | "ESCALATE" | "REJECT"
  >("APPROVE_FOR_PROCESSING");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Settlement states
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleReason, setSettleReason] = useState("");
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [settleSuccess, setSettleSuccess] = useState<string | null>(null);

  const loadAllClaimData = async () => {
    if (!claimId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [
        claimData,
        docsData,
        eventsData,
        evidenceData,
        assessmentData,
        investigationData,
        reviewsData,
        settlementData,
        auditLogsData,
      ] = await Promise.all([
        api.claims.get(claimId),
        api.claims.listDocuments(claimId).catch(() => []),
        api.claims.getEvents(claimId).catch(() => []),
        api.claims.getEvidence(claimId).catch(() => []),
        api.claims.getAssessment(claimId).catch(() => null),
        api.claims.getInvestigation(claimId).catch(() => null),
        api.claims.listReviews(claimId).catch(() => []),
        api.claims.getSettlement(claimId).catch(() => null),
        api.claims.getAuditLogs(claimId).catch(() => []),
      ]);

      setClaim(claimData);
      setDocuments(docsData || []);
      setEvents(eventsData || []);
      setEvidence(evidenceData || []);
      setAssessment(assessmentData);
      setInvestigation(investigationData);
      setReviews(reviewsData || []);
      setSettlement(settlementData);
      setAuditLogs(auditLogsData || []);
      if (claimData) {
        setSettleAmount(claimData.claim_amount);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load claim workspace data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllClaimData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const handleTriggerInvestigation = async () => {
    setIsTriggeringInvestigation(true);
    try {
      await api.claims.triggerInvestigation(claimId);
      await loadAllClaimData();
    } catch (err: any) {
      alert(`Investigation trigger error: ${err.message}`);
    } finally {
      setIsTriggeringInvestigation(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      alert("Please provide review notes.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewSuccess(null);
    try {
      await api.claims.submitReview(claimId, {
        decision: reviewDecision,
        notes: reviewNotes.trim(),
      });
      setReviewSuccess("Review decision recorded successfully.");
      setReviewNotes("");
      await loadAllClaimData();
    } catch (err: any) {
      alert(`Failed to submit review: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSettleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleReason.trim()) {
      alert("Please state settlement reason/terms.");
      return;
    }

    setIsSubmittingSettle(true);
    setSettleSuccess(null);
    try {
      await api.claims.settle(claimId, {
        settlement_amount: Number(settleAmount),
        reason: settleReason.trim(),
      });
      setSettleSuccess("Claim settlement recorded successfully.");
      setSettleReason("");
      await loadAllClaimData();
    } catch (err: any) {
      alert(`Failed to settle claim: ${err.message}`);
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Loading claims investigation workspace…
        </p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-[var(--color-error)] mx-auto" />
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Claim Not Found
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          {error || "Unable to locate this claim in the system."}
        </p>
        <Link
          href="/admin/claims"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--green-700)] text-white hover:opacity-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Claims
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div>
        <Link
          href="/admin/claims"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Claims Directory
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
                {claim.title}
              </h1>
              <StatusBadge status={claim.status} />
              {claim.requires_human_review && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--amber-50)] text-[var(--amber-800)] border border-[var(--amber-300)]">
                  Review Required
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
              <span>
                ID: <strong className="text-[var(--text-primary)]">{claim.claim_number}</strong>
              </span>
              <span>·</span>
              <span>
                Policy: <strong className="text-[var(--text-primary)]">{claim.policy_number}</strong>
              </span>
              <span>·</span>
              <span>Claimant: {claim.claimant_id.substring(0, 8)}…</span>
              <span>·</span>
              <span>Filed: {formatDate(claim.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerInvestigation}
              disabled={isTriggeringInvestigation}
              className="h-9 px-3.5 flex items-center gap-2 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              style={{ backgroundColor: "var(--green-700)" }}
            >
              {isTriggeringInvestigation ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Running AI Agents…</span>
                </>
              ) : (
                <>
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Run AI Investigation</span>
                </>
              )}
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className="h-9 px-3.5 flex items-center gap-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--amber-500)] text-white hover:bg-[var(--amber-600)] transition-colors shadow-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Review / Settle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[var(--border-subtle)] flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { key: "overview", label: "Claim Overview", icon: FileText },
          { key: "investigation", label: "AI Investigation", icon: Cpu },
          { key: "coverage", label: "Coverage & Anomalies", icon: ShieldAlert },
          { key: "evidence", label: "Evidence & Docs", icon: FileSearch },
          { key: "review", label: "Adjuster Review", icon: UserCheck },
          { key: "audit", label: "Audit Trail", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-[var(--green-700)] text-[var(--green-800)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
                <CardTitle className="text-sm font-bold">Claim Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-0.5">
                      Type
                    </span>
                    <Badge variant="outline" size="sm">
                      {CLAIM_TYPE_LABELS[claim.claim_type] || claim.claim_type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-0.5">
                      Incident Date
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatDate(claim.incident_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-0.5">
                      Claimed Amount
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(claim.claim_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block mb-0.5">
                      Complexity
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {claim.complexity || "Standard (Auto)"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                    Claimant Incident Statement
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-subtle)]/50 p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] whitespace-pre-wrap">
                    {claim.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--green-700)]" />
                  Lifecycle Events & Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {events.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    No events recorded for this claim.
                  </p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-subtle)]">
                    {events.map((evt) => (
                      <div key={evt.id} className="relative flex items-start gap-3 pl-7">
                        <div className="absolute left-1.5 top-1.5 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--green-700)] shadow-xs" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {evt.message}
                          </p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                            {formatDate(evt.created_at)} · Actor: {evt.actor_type} ({evt.actor.substring(0, 8)}…)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quick Status & Recommendation */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--green-700)]" />
                  AI Triage Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {assessment ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                        Recommendation
                      </span>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold uppercase mt-1 ${
                          assessment.recommendation === "automated_processing"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {assessment.recommendation.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                        Coverage Status
                      </span>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                        {assessment.coverage_status.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                        Agent Reasons
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)] mt-1">
                        {assessment.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">
                      AI assessment has not been executed yet.
                    </p>
                    <button
                      onClick={handleTriggerInvestigation}
                      disabled={isTriggeringInvestigation}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--green-700)] text-white hover:opacity-95"
                    >
                      Run AI Assessment
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
                <CardTitle className="text-sm font-bold">Documents ({documents.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {documents.length === 0 ? (
                  <p className="text-[var(--text-secondary)] italic">No documents attached.</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold truncate">{doc.file_name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          {doc.document_type} · {(doc.file_size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-[var(--green-800)] bg-[var(--green-50)] px-2 py-0.5 rounded-full shrink-0">
                        {doc.processing_status}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: AI Investigation */}
      {activeTab === "investigation" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[var(--green-700)]" />
                  Multi-Agent Investigation Summary
                </CardTitle>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Autonomous agents analyzing document authenticity, policy coverage, anomaly detection, and settlement calculations.
                </p>
              </div>
              <button
                onClick={handleTriggerInvestigation}
                disabled={isTriggeringInvestigation}
                className="h-8 px-3 text-xs font-semibold rounded bg-[var(--green-700)] text-white hover:opacity-95 flex items-center gap-1.5"
              >
                {isTriggeringInvestigation ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Rerun Pipeline
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {investigation && investigation.agent_runs.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Agent Orchestration Pipeline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {investigation.agent_runs.map((run) => (
                        <div
                          key={run.id}
                          className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)]">
                              {run.agent_type}
                            </span>
                            <StatusBadge status={run.status} size="sm" />
                          </div>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            Execution: {run.execution_time_ms ? `${run.execution_time_ms}ms` : "Active / Streamed"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Agent Findings ({investigation.findings.length})
                    </h3>
                    {investigation.findings.length === 0 ? (
                      <p className="text-xs text-[var(--text-secondary)]">
                        No critical findings or violations detected by agents.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {investigation.findings.map((f) => (
                          <div
                            key={f.id}
                            className="p-3 rounded-[var(--radius-md)] bg-white border border-[var(--border-subtle)] text-xs flex items-start gap-3 shadow-xs"
                          >
                            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                              f.severity === "CRITICAL" || f.severity === "HIGH"
                                ? "text-red-600"
                                : "text-amber-600"
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-[var(--text-primary)]">
                                  {f.title}
                                </span>
                                <Badge
                                  variant={
                                    f.severity === "CRITICAL" || f.severity === "HIGH"
                                      ? "error"
                                      : "warning"
                                  }
                                  size="sm"
                                >
                                  {f.severity}
                                </Badge>
                              </div>
                              <p className="text-[var(--text-secondary)] leading-relaxed">
                                {f.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Cpu className="h-8 w-8 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    No investigation agent runs recorded yet.
                  </p>
                  <button
                    onClick={handleTriggerInvestigation}
                    disabled={isTriggeringInvestigation}
                    className="px-4 py-2 text-xs font-semibold rounded bg-[var(--green-700)] text-white hover:opacity-95"
                  >
                    Trigger Autonomous AI Investigation
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Coverage & Anomalies */}
      {activeTab === "coverage" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold">Policy RAG & Coverage Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {assessment ? (
                <>
                  <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        Coverage Status
                      </span>
                      <span className="px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-800 uppercase">
                        {assessment.coverage_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {assessment.coverage_summary || "Policy active during incident date. Claimed peril verified under policy clauses."}
                    </p>
                  </div>

                  <div className="p-4 rounded-[var(--radius-md)] bg-[var(--amber-50)]/50 border border-[var(--amber-200)] space-y-1.5">
                    <span className="font-bold text-xs text-[var(--amber-900)]">
                      Anomaly Summary
                    </span>
                    <p className="text-xs text-[var(--amber-800)] leading-relaxed">
                      {assessment.anomaly_summary || "No severe anomalies or discrepancies detected across documents."}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] italic">
                  Run the AI investigation to retrieve policy chunks and evaluate coverage.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Evidence Vault */}
      {activeTab === "evidence" && (
        <Card>
          <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-[var(--green-700)]" />
              Evidence Graph & Document Extracts ({evidence.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {evidence.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No extracted evidence recorded yet. Run the AI investigation to generate evidence nodes.
              </p>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[var(--green-800)]">
                        {item.evidence_type}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <blockquote className="p-2.5 rounded bg-white border-l-2 border-[var(--green-700)] text-[var(--text-primary)] italic font-serif">
                      &ldquo;{item.source_text}&rdquo;
                    </blockquote>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Adjuster Review & Settlement */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit Human Decision */}
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[var(--green-700)]" />
                Submit Adjuster Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {reviewSuccess && (
                <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-xs text-green-800 font-medium">
                  ✓ {reviewSuccess}
                </div>
              )}
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Decision
                  </label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value as any)}
                    className="w-full h-9 px-3 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)]"
                  >
                    <option value="APPROVE_FOR_PROCESSING">
                      Approve for Processing
                    </option>
                    <option value="REQUEST_INFORMATION">
                      Request Missing Information
                    </option>
                    <option value="ESCALATE">Escalate to Senior Investigator</option>
                    <option value="REJECT">Reject Claim</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Review Notes & Rationale <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter formal justification, verified policy limits, or reasons for escalation/rejection…"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full h-9 font-semibold text-white rounded-[var(--radius-md)] bg-[var(--green-700)] hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  <span>Record Human Decision</span>
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Settle Claim Form */}
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[var(--green-700)]" />
                Settlement Disbursement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {settleSuccess && (
                <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-xs text-green-800 font-medium">
                  ✓ {settleSuccess}
                </div>
              )}
              {settlement ? (
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)] uppercase font-semibold">
                      Settlement Status
                    </span>
                    <span className="font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                      {settlement.status}
                    </span>
                  </div>
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    Disbursed: {formatCurrency(settlement.settlement_amount)}
                  </p>
                  <p className="text-[var(--text-secondary)] italic">
                    Reason: {settlement.reason}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSettleClaim} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Settlement Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-3 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Settlement Terms & Disbursement Reason
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Approved following deductible reduction. Payment approved for vehicle repairs."
                      value={settleReason}
                      onChange={(e) => setSettleReason(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSettle}
                    className="w-full h-9 font-semibold text-white rounded-[var(--radius-md)] bg-[var(--amber-600)] hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingSettle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                    <span>Disburse / Settle Claim</span>
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Past Review Decisions */}
          {reviews.length > 0 && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
                  <CardTitle className="text-sm font-bold">Past Review Decisions ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--green-800)]">{rev.decision}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{formatDate(rev.created_at)}</span>
                      </div>
                      <p className="text-[var(--text-secondary)]">{rev.notes}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--green-700)]" />
              Cryptographic Audit Log Records ({auditLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <p className="p-5 text-xs text-[var(--text-secondary)] italic">
                No formal audit records for this claim.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-subtle)]/60 text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Actor Type</th>
                      <th className="py-2.5 px-4">Actor ID</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--bg-subtle)]/40">
                        <td className="py-2.5 px-4 font-bold text-[var(--green-800)]">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-primary)]">
                          {log.actor_type}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                          {log.actor_id.substring(0, 12)}…
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-tertiary)]">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
