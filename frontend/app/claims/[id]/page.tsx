"use client";
import React, { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText, User, Hash, MapPin, Calendar,
  DollarSign, AlertTriangle, CheckCircle2,
  FileSearch, FolderOpen, Cpu, Shield, Info, Eye,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, StatusBadge,
  Tabs, TabPanel,
  Progress,
  Alert,
  Timeline,
  EmptyState,
} from "@/components/ui";
import { getClaimById } from "@/lib/mockClaims";
import { CLAIM_TYPE_LABELS, AI_RECOMMENDATION_LABELS, aiRecommendationVariant, priorityVariant, PRIORITY_LABELS, fraudScoreColor } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClaimDocument, AnomalyFlag, MissingInfo } from "@/types/claimDetail";

// ─── NEW CLAIM STUB (for freshly submitted claims) ───────────────────────────
function NewClaimStub({ id }: { id: string }) {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link href="/claims" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--green-600)] transition-colors">
          <ChevronLeft className="h-4 w-4" />Claims
        </Link>
      </div>
      <Alert
        variant="success"
        title="Claim Submitted Successfully"
        description={`Your claim has been assigned ID: ${id}. AI agents are now processing your submission.`}
      />
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-[var(--green-50)] flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-[var(--green-600)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Processing Your Claim</h2>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
            Claim <span className="font-mono font-semibold text-[var(--green-700)]">{id}</span> has been submitted and AI agents are running intake validation, fraud risk assessment, and document analysis.
          </p>
          <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
            {["Policy Verification", "Document OCR Extraction", "Fraud Risk Scoring", "Damage Estimation Queue"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                {i === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
                ) : i === 1 ? (
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--green-500)] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--border-default)] shrink-0" />
                )}
                <span className={`text-xs ${i <= 1 ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{step}</span>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <Link href="/claims" className="text-sm text-[var(--green-600)] hover:underline">← Return to Claims Queue</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }       = use(params);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const isNew        = searchParams.get("new") === "1";

  if (isNew) return <NewClaimStub id={id} />;

  const claim = getClaimById(id);

  if (!claim) {
    return (
      <div className="space-y-6 page-enter">
        <Link href="/claims" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--green-600)]">
          <ChevronLeft className="h-4 w-4" />Claims
        </Link>
        <EmptyState
          icon={<FileSearch />}
          title="Claim Not Found"
          description={`No claim found with ID: ${id}`}
          action={{ label: "Return to Claims", onClick: () => router.push("/claims") }}
        />
      </div>
    );
  }

  const tabs = [
    { value: "overview",     label: "Overview",          icon: <Eye className="h-4 w-4" /> },
    { value: "documents",    label: "Documents",         icon: <FolderOpen className="h-4 w-4" />, badge: claim.documents.length },
    { value: "investigation",label: "Investigation",     icon: <Cpu className="h-4 w-4" /> },
    { value: "coverage",     label: "Coverage",          icon: <Shield className="h-4 w-4" /> },
    { value: "anomalies",    label: "Anomalies",         icon: <AlertTriangle className="h-4 w-4" />, badge: claim.anomalies.filter((a) => !a.resolved).length || undefined },
    { value: "missing",      label: "Missing Info",      icon: <Info className="h-4 w-4" />, badge: claim.missingInfo.filter((m) => !m.resolvedAt).length || undefined },
    { value: "assessment",   label: "Assessment",        icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Back nav */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
        <Link href="/claims" className="inline-flex items-center gap-1 hover:text-[var(--green-600)] transition-colors">
          <ChevronLeft className="h-4 w-4" />Claims
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">{claim.claimNumber}</span>
      </div>

      {/* ── Claim Header Card ── */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            {/* Left: Core info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--green-50)] text-[var(--green-600)] shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight font-mono">
                      {claim.claimNumber}
                    </h1>
                    <StatusBadge status={claim.status} />
                    <Badge variant={priorityVariant(claim.priority)} size="sm">{PRIORITY_LABELS[claim.priority]}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{CLAIM_TYPE_LABELS[claim.type]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                <MetaField icon={<User />}     label="Claimant"       value={claim.policyHolder.name} />
                <MetaField icon={<Hash />}     label="Policy"         value={claim.policyHolder.policyNumber} mono />
                <MetaField icon={<Calendar />} label="Incident Date"  value={formatDate(claim.incidentDate)} />
                <MetaField icon={<Calendar />} label="Filed"          value={formatDate(claim.filingDate)} />
                <MetaField icon={<MapPin />}   label="Location"       value={claim.incidentLocation} truncate />
                <MetaField icon={<User />}     label="Adjuster"       value={claim.assignedAdjuster ?? "Unassigned"} />
              </div>
            </div>

            {/* Right: Key numbers */}
            <div className="flex flex-row lg:flex-col gap-3 shrink-0">
              <div className="text-right">
                <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Claimed Amount</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums">
                  {formatCurrency(claim.estimatedLoss)}
                </p>
              </div>
              {claim.approvedPayout !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Approved Payout</p>
                  <p className="text-xl font-bold text-[var(--color-success)] tracking-tight tabular-nums">
                    {formatCurrency(claim.approvedPayout)}
                  </p>
                </div>
              )}
              {claim.aiRecommendation && (
                <div className="text-right">
                  <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-1">AI Verdict</p>
                  <Badge variant={aiRecommendationVariant(claim.aiRecommendation)}>
                    {AI_RECOMMENDATION_LABELS[claim.aiRecommendation]}
                  </Badge>
                  {claim.aiConfidence && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{claim.aiConfidence}% confidence</p>
                  )}
                </div>
              )}
              {claim.fraudRiskScore !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Fraud Score</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: fraudScoreColor(claim.fraudRiskScore) }}>
                    {claim.fraudRiskScore}<span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabbed Workspace ── */}
      <Tabs tabs={tabs} variant="underline">
        {/* Overview */}
        <TabPanel value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* Description */}
              <Card>
                <CardHeader borderless><CardTitle>Incident Description</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{claim.description}</p>
                </CardContent>
              </Card>
              {/* Fraud Risk */}
              {claim.fraudRiskScore !== undefined && (
                <Card>
                  <CardHeader borderless><CardTitle>Fraud Risk Assessment</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">Risk Score</span>
                      <span className="text-lg font-bold tabular-nums" style={{ color: fraudScoreColor(claim.fraudRiskScore) }}>
                        {claim.fraudRiskScore}/100
                      </span>
                    </div>
                    <Progress
                      value={claim.fraudRiskScore}
                      variant={claim.fraudRiskScore < 20 ? "success" : claim.fraudRiskScore < 50 ? "warning" : "error"}
                      size="md"
                    />
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {claim.fraudRiskScore < 20 ? "✓ Low fraud risk — eligible for auto-processing track."
                       : claim.fraudRiskScore < 50 ? "⚠ Moderate risk — additional review recommended."
                       : "⚠ High fraud risk — manual investigation required."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader borderless><CardTitle>Activity Timeline</CardTitle></CardHeader>
              <CardContent className="pb-5">
                <Timeline items={claim.timeline.map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  timestamp: t.timestamp ? formatDate(t.timestamp.split("T")[0]) : undefined,
                  status: t.status,
                  meta: t.actor,
                }))} />
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Documents */}
        <TabPanel value="documents">
          {claim.documents.length === 0 ? (
            <EmptyState icon={<FolderOpen />} title="No Documents" description="No supporting documents have been uploaded for this claim." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </TabPanel>

        {/* Investigation */}
        <TabPanel value="investigation">
          <div className="space-y-5">
            <Card>
              <CardHeader borderless><CardTitle>AI Agent Investigation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { agent: "Intake Validator",  role: "Policy verification, coverage confirmation, document indexing", status: "completed", finding: "Policy active. Coverage confirmed. All documents indexed." },
                  { agent: "Fraud Detector",    role: "Pattern analysis, prior claim cross-reference, metadata verification", status: claim.status === "under_investigation" ? "active" : "completed", finding: claim.anomalies.length > 0 ? `${claim.anomalies.length} anomalies detected — see Anomalies tab.` : "No significant fraud indicators detected." },
                  { agent: "Damage Estimator",  role: "Repair cost analysis, medical bill review, market rate comparison", status: claim.status === "assessment_pending" ? "active" : claim.status === "approved" || claim.status === "rejected" ? "completed" : "pending", finding: claim.status === "approved" ? `Assessment complete. Recommended: ${formatCurrency(claim.approvedPayout ?? 0)}` : "Awaiting investigation results." },
                  { agent: "Policy Checker",    role: "Coverage eligibility, exclusion review, policy limits verification", status: "completed", finding: "No coverage exclusions apply to this claim type." },
                  { agent: "Orchestrator",      role: "Multi-agent coordination, workflow routing, human escalation decisions", status: "active", finding: `Current routing: ${claim.aiRecommendation ? AI_RECOMMENDATION_LABELS[claim.aiRecommendation] : "Evaluating…"}` },
                ].map((a) => (
                  <div key={a.agent} className="flex items-start gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <div className="shrink-0">
                      <StatusBadge status={a.status === "active" ? "running" : a.status as "completed" | "pending"} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{a.agent} Agent</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{a.role}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1.5 italic">→ {a.finding}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Coverage */}
        <TabPanel value="coverage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader borderless><CardTitle>Policy Coverage</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <CoverageField label="Policy Type"  value={claim.coverage.policyType} />
                  <CoverageField label="Status"       value={claim.coverage.isActive ? "Active" : "Lapsed"} highlight={claim.coverage.isActive} />
                  <CoverageField label="Coverage Limit" value={formatCurrency(claim.coverage.coverageLimit)} />
                  <CoverageField label="Deductible"   value={formatCurrency(claim.coverage.deductible)} />
                  <CoverageField label="Expiry"       value={formatDate(claim.coverage.expiryDate)} />
                  <CoverageField label="Prior Claims" value={String(claim.coverage.priorClaims)} />
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader borderless><CardTitle>Covered Perils</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {claim.coverage.coveredPerils.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader borderless><CardTitle>Exclusions</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {claim.coverage.exclusions.map((e) => (
                      <li key={e} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="h-3.5 w-3.5 flex items-center justify-center text-[var(--color-error)] shrink-0 font-bold text-xs">✕</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* Anomalies */}
        <TabPanel value="anomalies">
          {claim.anomalies.length === 0 ? (
            <EmptyState icon={<CheckCircle2 />} title="No Anomalies Detected" description="AI agents found no fraud indicators or inconsistencies in this claim." />
          ) : (
            <div className="space-y-3">
              {claim.anomalies.map((a) => <AnomalyCard key={a.id} anomaly={a} />)}
            </div>
          )}
        </TabPanel>

        {/* Missing Info */}
        <TabPanel value="missing">
          {claim.missingInfo.length === 0 ? (
            <EmptyState icon={<CheckCircle2 />} title="No Missing Information" description="All required documentation and information has been received." />
          ) : (
            <div className="space-y-3">
              {claim.missingInfo.map((m) => <MissingInfoCard key={m.id} info={m} />)}
            </div>
          )}
        </TabPanel>

        {/* Assessment */}
        <TabPanel value="assessment">
          <Card>
            <CardHeader borderless><CardTitle>Loss Assessment</CardTitle></CardHeader>
            <CardContent>
              {claim.status === "approved" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)]">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Claimed</p>
                      <p className="text-xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">{formatCurrency(claim.estimatedLoss)}</p>
                    </div>
                    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--green-50)]">
                      <p className="text-xs text-[var(--green-700)] font-medium uppercase tracking-wider">Approved Payout</p>
                      <p className="text-xl font-bold text-[var(--green-700)] mt-1 tabular-nums">{formatCurrency(claim.approvedPayout ?? 0)}</p>
                    </div>
                    <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)]">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Deductible Applied</p>
                      <p className="text-xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">{formatCurrency(claim.policyHolder.deductible)}</p>
                    </div>
                  </div>
                  <Alert variant="success" title="Claim Approved" description={`Settlement of ${formatCurrency(claim.approvedPayout ?? 0)} has been approved and payment is being processed.`} />
                </div>
              ) : claim.status === "rejected" ? (
                <Alert variant="error" title="Claim Rejected" description="This claim was rejected. Please refer to the Anomalies tab for the specific reasons." />
              ) : (
                <div className="space-y-4">
                  <Alert variant="info" title="Assessment In Progress" description="AI agents are currently processing the damage estimate. Results will appear here once complete." />
                  <div className="space-y-2">
                    <Progress value={40} label="Damage Estimation" showValue variant="action" animated />
                    <Progress value={100} label="Policy Review" showValue variant="primary" />
                    <Progress value={claim.anomalies.length === 0 ? 100 : 60} label="Fraud Analysis" showValue variant="primary" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function MetaField({ icon, label, value, mono = false, truncate = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; truncate?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[var(--text-muted)]">
        <span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-medium text-[var(--text-primary)] ${mono ? "font-mono" : ""} ${truncate ? "truncate max-w-[200px]" : ""}`}
         title={truncate ? value : undefined}>
        {value}
      </p>
    </div>
  );
}

function DocumentCard({ doc }: { doc: ClaimDocument }) {
  const typeLabels: Record<ClaimDocument["documentType"], string> = {
    photo:           "Photo",
    police_report:   "Police Report",
    repair_estimate: "Repair Estimate",
    medical_record:  "Medical Record",
    other:           "Document",
  };
  const isImage = doc.mimeType.startsWith("image/");
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] flex items-center justify-center text-xl shrink-0">
            {isImage ? "🖼" : doc.documentType === "medical_record" ? "🏥" : "📄"}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.fileName}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm">{typeLabels[doc.documentType]}</Badge>
              {doc.ocrProcessed && <Badge variant="success" size="sm">OCR Complete</Badge>}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {(doc.fileSize / 1024).toFixed(0)} KB · Uploaded {formatDate(doc.uploadedAt.split("T")[0])}
            </p>
            {doc.extractedText && (
              <p className="text-[10px] text-[var(--text-muted)] italic border-l-2 border-[var(--border-default)] pl-2 mt-1 leading-relaxed line-clamp-2">
                {doc.extractedText}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SEVERITY_CFG = {
  low:      { badge: "default" as const,  label: "Low" },
  medium:   { badge: "warning" as const,  label: "Medium" },
  high:     { badge: "error"   as const,  label: "High" },
  critical: { badge: "error"   as const,  label: "Critical" },
};
const ANOMALY_LABELS: Record<AnomalyFlag["type"], string> = {
  date_inconsistency:  "Date Inconsistency",
  location_mismatch:   "Location Mismatch",
  prior_claim:         "Prior Claim Pattern",
  policy_lapse:        "Policy Lapse",
  fraud_indicator:     "Fraud Indicator",
  excessive_amount:    "Excessive Amount",
};

function AnomalyCard({ anomaly }: { anomaly: AnomalyFlag }) {
  const cfg = SEVERITY_CFG[anomaly.severity];
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${anomaly.severity === "high" || anomaly.severity === "critical" ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"}`} />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{ANOMALY_LABELS[anomaly.type]}</p>
              <Badge variant={cfg.badge} size="sm">{cfg.label} Risk</Badge>
              {anomaly.resolved && <Badge variant="success" size="sm">Resolved</Badge>}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{anomaly.description}</p>
            <p className="text-xs text-[var(--text-muted)]">Detected by {anomaly.detectedBy} · {formatDate(anomaly.detectedAt.split("T")[0])}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MissingInfoCard({ info }: { info: MissingInfo }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-[var(--color-info)]" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{info.field}</p>
              {info.required && <Badge variant="error" size="sm">Required</Badge>}
              {info.resolvedAt && <Badge variant="success" size="sm">Resolved</Badge>}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{info.description}</p>
            <p className="text-xs text-[var(--text-muted)]">Requested {formatDate(info.requestedAt.split("T")[0])}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoverageField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-[var(--color-success)]" : "text-[var(--text-primary)]"}`}>{value}</p>
    </div>
  );
}
