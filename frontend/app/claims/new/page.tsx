"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, MapPin, Calendar, DollarSign,
  CheckCircle2, Upload, ChevronLeft, ChevronRight,
  User, Hash, AlertTriangle,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  Button, Badge, Progress, Alert,
} from "@/components/ui";
import { CLAIM_TYPE_OPTIONS } from "@/lib/claimHelpers";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Step Progress ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Claim Information",    icon: FileText },
  { id: 2, label: "Supporting Evidence",  icon: Upload },
  { id: 3, label: "Review & Submit",      icon: CheckCircle2 },
];

// ─── Tiny inline file-list component ────────────────────────────────────────
interface FileEntry { id: string; file: File; }
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
interface FormData {
  claimantName: string;
  policyNumber: string;
  claimType: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  estimatedAmount: string;
}

const INITIAL_FORM: FormData = {
  claimantName: "",
  policyNumber: "",
  claimType: "",
  incidentDate: "",
  incidentLocation: "",
  description: "",
  estimatedAmount: "",
};

export default function NewClaimPage() {
  const router = useRouter();
  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState<FormData>(INITIAL_FORM);
  const [files,      setFiles]      = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors,     setErrors]     = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Field helpers
  const field = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
  };

  // ── Validation
  function validateStep1(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.claimantName.trim())   e.claimantName   = "Claimant name is required.";
    if (!form.policyNumber.trim())   e.policyNumber   = "Policy number is required.";
    if (!form.claimType)             e.claimType      = "Select a claim type.";
    if (!form.incidentDate)          e.incidentDate   = "Incident date is required.";
    if (!form.incidentLocation.trim()) e.incidentLocation = "Location is required.";
    if (form.description.trim().length < 30) e.description = "Please provide at least 30 characters of description.";
    if (!form.estimatedAmount || isNaN(Number(form.estimatedAmount)) || Number(form.estimatedAmount) <= 0)
      e.estimatedAmount = "Enter a valid estimated amount.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── File drag-and-drop
  const addFiles = useCallback((newFiles: File[]) => {
    const entries: FileEntry[] = newFiles.map((f) => ({ id: crypto.randomUUID(), file: f }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ── Navigation
  function next() {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setStep((s) => Math.max(s - 1, 1)); }
  function goToStep(s: number) { if (s < step) setStep(s); }

  // ── Submit
  async function handleSubmit() {
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    const id = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}-NEW`;
    router.push(`/claims/${id}?new=1`);
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="space-y-6 page-enter max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">File a New Claim</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Complete all sections. Your information is encrypted and securely processed by our AI.
        </p>
      </div>

      {/* Step Progress */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-4 relative">
            {STEPS.map((s, idx) => {
              const done    = step > s.id;
              const current = step === s.id;
              const Icon    = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => goToStep(s.id)}
                    disabled={s.id > step}
                    className={cn(
                      "flex flex-col items-center gap-1.5 z-10 disabled:cursor-not-allowed",
                      s.id < step && "cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-full border-2 flex items-center justify-center transition-all",
                      done    ? "bg-[var(--green-600)] border-[var(--green-600)] text-white"
                              : current ? "bg-[var(--bg-card)] border-[var(--green-600)] text-[var(--green-600)]"
                                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-muted)]"
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block text-center leading-tight",
                      current ? "text-[var(--green-700)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    )}>
                      {s.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 mt-[18px] h-0.5 bg-[var(--border-default)] relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--green-500)] transition-all duration-500"
                        style={{ width: step > s.id ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <Progress value={progressPct} variant="primary" size="xs" />
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Step {step} of {STEPS.length}</p>
        </CardContent>
      </Card>

      {/* ══════════════ STEP 1: Claim Information ══════════════ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Claim Information</CardTitle>
            <Badge variant="primary" size="sm">Step 1</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Claimant Full Name" required error={errors.claimantName} icon={<User className="h-4 w-4" />}>
                <input
                  value={form.claimantName}
                  onChange={field("claimantName")}
                  placeholder="e.g. Marcus J. Rivera"
                  className={inputCls(!!errors.claimantName)}
                />
              </FieldGroup>
              <FieldGroup label="Policy Number" required error={errors.policyNumber} icon={<Hash className="h-4 w-4" />}>
                <input
                  value={form.policyNumber}
                  onChange={field("policyNumber")}
                  placeholder="e.g. POL-FL-2021-88821"
                  className={inputCls(!!errors.policyNumber)}
                />
              </FieldGroup>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Claim Type" required error={errors.claimType}>
                <div className="relative">
                  <select
                    value={form.claimType}
                    onChange={field("claimType")}
                    className={cn(selectCls(!!errors.claimType), "appearance-none")}
                  >
                    <option value="">Select claim type…</option>
                    {CLAIM_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </FieldGroup>
              <FieldGroup label="Incident Date" required error={errors.incidentDate} icon={<Calendar className="h-4 w-4" />}>
                <input
                  type="date"
                  value={form.incidentDate}
                  onChange={field("incidentDate")}
                  max={new Date().toISOString().split("T")[0]}
                  className={inputCls(!!errors.incidentDate)}
                />
              </FieldGroup>
            </div>
            {/* Row 3 */}
            <FieldGroup label="Incident Location" required error={errors.incidentLocation} icon={<MapPin className="h-4 w-4" />}>
              <input
                value={form.incidentLocation}
                onChange={field("incidentLocation")}
                placeholder="Full address or descriptive location"
                className={inputCls(!!errors.incidentLocation)}
              />
            </FieldGroup>
            {/* Row 4 */}
            <FieldGroup label="Incident Description" required error={errors.description}
              hint="Describe what happened, how the damage occurred, and any injuries or losses. Minimum 30 characters.">
              <textarea
                value={form.description}
                onChange={field("description")}
                rows={4}
                placeholder="Provide a detailed description of the incident and resulting damage or loss…"
                className={cn(
                  "w-full px-3 py-2.5 text-sm rounded-[var(--radius-lg)] border outline-none resize-y transition-all",
                  "bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  errors.description
                    ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
                    : "border-[var(--border-default)] focus:border-[var(--green-500)] focus:ring-2 focus:ring-[var(--green-500)]/20"
                )}
              />
              <div className={cn("text-right text-[10px] mt-0.5", form.description.length < 30 ? "text-[var(--color-warning)]" : "text-[var(--text-muted)]")}>
                {form.description.length} / 30+ characters
              </div>
            </FieldGroup>
            {/* Row 5 */}
            <FieldGroup label="Estimated Claim Amount (USD)" required error={errors.estimatedAmount} icon={<DollarSign className="h-4 w-4" />}>
              <input
                type="number"
                min="0"
                step="100"
                value={form.estimatedAmount}
                onChange={field("estimatedAmount")}
                placeholder="0.00"
                className={cn(inputCls(!!errors.estimatedAmount), "pl-9")}
              />
            </FieldGroup>

            <Alert variant="info" title="AI Processing Notice" description="Upon submission, our AI agents will automatically validate your policy, assess fraud risk, and cross-reference all submitted evidence." />
          </CardContent>
          <CardFooter>
            <span className="text-xs text-[var(--text-muted)]">All fields marked * are required</span>
            <Button variant="primary" size="sm" onClick={next} rightIcon={<ChevronRight />}>
              Continue to Evidence
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ══════════════ STEP 2: Supporting Evidence ══════════════ */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
            <Badge variant="primary" size="sm">Step 2</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert
              variant="info"
              title="Document Requirements"
              description="Upload relevant documents such as police reports, repair estimates, medical records, and photos. Multiple files accepted."
            />

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => document.getElementById("file-upload-input")?.click()}
              className={cn(
                "border-2 border-dashed rounded-[var(--radius-xl)] p-10 flex flex-col items-center gap-3 cursor-pointer transition-all",
                isDragging
                  ? "border-[var(--green-500)] bg-[var(--green-50)]"
                  : "border-[var(--border-default)] bg-[var(--bg-subtle)] hover:border-[var(--green-400)] hover:bg-[var(--green-50)]"
              )}
            >
              <div className={cn("p-3 rounded-[var(--radius-xl)] transition-colors", isDragging ? "bg-[var(--green-100)]" : "bg-[var(--bg-card)]")}>
                <Upload className={cn("h-6 w-6 transition-colors", isDragging ? "text-[var(--green-600)]" : "text-[var(--text-muted)]")} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {isDragging ? "Drop files here" : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  PDF, JPG, PNG, DOCX — max 25 MB per file
                </p>
              </div>
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                className="sr-only"
                onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Uploaded Files ({files.length})
                </p>
                <ul className="space-y-2">
                  {files.map((f) => {
                    const isImage = f.file.type.startsWith("image/");
                    const isPDF   = f.file.type === "application/pdf";
                    return (
                      <li key={f.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                        <div className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] shrink-0 text-[var(--text-tertiary)]">
                          {isImage ? "🖼" : isPDF ? "📄" : "📁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{f.file.name}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {f.file.type.split("/")[1]?.toUpperCase()} · {formatBytes(f.file.size)}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">Ready</Badge>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors p-1 rounded"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {files.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                No documents uploaded. You can proceed, but documentation speeds up claim processing.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm" onClick={back} leftIcon={<ChevronLeft />}>Back</Button>
            <Button variant="primary" size="sm" onClick={next} rightIcon={<ChevronRight />}>
              Review & Submit
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ══════════════ STEP 3: Review & Submit ══════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claim Summary</CardTitle>
              <Badge variant="action" size="sm">Final Review</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Claim details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <ReviewField label="Claimant Name"     value={form.claimantName} onEdit={() => setStep(1)} />
                <ReviewField label="Policy Number"     value={form.policyNumber} onEdit={() => setStep(1)} />
                <ReviewField label="Claim Type"        value={CLAIM_TYPE_OPTIONS.find((o) => o.value === form.claimType)?.label ?? "—"} onEdit={() => setStep(1)} />
                <ReviewField label="Incident Date"     value={form.incidentDate} onEdit={() => setStep(1)} />
                <ReviewField label="Incident Location" value={form.incidentLocation} onEdit={() => setStep(1)} />
                <ReviewField
                  label="Estimated Amount"
                  value={form.estimatedAmount ? formatCurrency(Number(form.estimatedAmount)) : "—"}
                  onEdit={() => setStep(1)}
                  highlight
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1.5">Description</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
                  {form.description}
                </p>
              </div>

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">Supporting Documents</p>
                  <button onClick={() => setStep(2)} className="text-xs text-[var(--green-600)] hover:underline">Edit</button>
                </div>
                {files.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">No documents uploaded</p>
                ) : (
                  <ul className="space-y-1.5">
                    {files.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />
                        <span className="font-medium">{f.file.name}</span>
                        <span className="text-[var(--text-muted)]">({formatBytes(f.file.size)})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Notice */}
          <Alert
            variant="success"
            title="Ready for AI Processing"
            description="Upon submission, AI agents will immediately begin: policy validation, fraud risk assessment, document OCR, and damage estimation. You will receive a claim ID and status updates."
          />

          <Card>
            <CardFooter className="rounded-[var(--radius-xl)]">
              <Button variant="secondary" size="sm" onClick={back} leftIcon={<ChevronLeft />}>Back</Button>
              <Button
                variant="action"
                size="lg"
                onClick={handleSubmit}
                isLoading={submitting}
                leftIcon={submitting ? undefined : <FileText className="h-4 w-4" />}
              >
                {submitting ? "Submitting Claim…" : "Submit Claim"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function FieldGroup({
  label, required, error, hint, icon, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string;
  icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}{required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
            {icon}
          </div>
        )}
        {children}
      </div>
      {hint  && !error && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
      {error && <p className="text-xs text-[var(--color-error)] flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full h-9 px-3 pl-9 text-sm rounded-[var(--radius-lg)] border outline-none transition-all",
    "bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
    hasError
      ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
      : "border-[var(--border-default)] focus:border-[var(--green-500)] focus:ring-2 focus:ring-[var(--green-500)]/20"
  );
}
function selectCls(hasError: boolean) {
  return cn(
    "w-full h-9 px-3 text-sm rounded-[var(--radius-lg)] border outline-none transition-all cursor-pointer",
    "bg-[var(--bg-card)] text-[var(--text-primary)]",
    hasError
      ? "border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
      : "border-[var(--border-default)] focus:border-[var(--green-500)] focus:ring-2 focus:ring-[var(--green-500)]/20"
  );
}

function ReviewField({
  label, value, onEdit, highlight,
}: {
  label: string; value: string; onEdit: () => void; highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)] mb-0.5">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-sm font-medium", highlight ? "text-[var(--green-700)] text-base font-bold" : "text-[var(--text-primary)]")}>
          {value || "—"}
        </p>
        <button onClick={onEdit} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--green-600)] transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}
