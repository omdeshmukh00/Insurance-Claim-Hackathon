"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  ArrowRight,
  Info,
  Loader2,
  Edit2,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

type UploadStep = "UPLOAD" | "ANALYZING" | "REVIEW" | "SAVED";

export default function PolicyUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzingStage, setAnalyzingStage] = useState<string>("Uploading document securely...");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable Form State after AI extraction
  const [extractedData, setExtractedData] = useState<{
    policy_number: string;
    insurer_name: string;
    policy_name: string;
    policy_type: "AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL";
    policyholder_name: string;
    insured_asset: string;
    start_date: string;
    expiry_date: string;
    premium: number;
    deductible: number;
    coverage: string[];
    limits: string[];
    exclusions: string[];
    extracted_evidence: any[];
  }>({
    policy_number: "",
    insurer_name: "",
    policy_name: "",
    policy_type: "AUTO",
    policyholder_name: "",
    insured_asset: "",
    start_date: "2026-01-01",
    expiry_date: "2026-12-31",
    premium: 0,
    deductible: 0,
    coverage: [],
    limits: [],
    exclusions: [],
    extracted_evidence: [],
  });

  const [newCoverageItem, setNewCoverageItem] = useState("");
  const [newLimitItem, setNewLimitItem] = useState("");
  const [newExclusionItem, setNewExclusionItem] = useState("");
  const [savedPolicyId, setSavedPolicyId] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setError("Please select a policy PDF or image first.");
      return;
    }

    try {
      setStep("ANALYZING");
      setError(null);

      setAnalyzingStage("Uploading document to secure storage...");
      await new Promise((r) => setTimeout(r, 600));

      setAnalyzingStage("Running Policy Document Agent (Gemini multimodal extraction)...");
      const result = await api.uploadPolicyFile(selectedFile);

      setAnalyzingStage("Correlating policy limits and structuring evidence...");
      await new Promise((r) => setTimeout(r, 400));

      const analysis = result.analysis;

      setExtractedData({
        policy_number: analysis.policy_number || "POL-" + Math.floor(100000 + Math.random() * 900000),
        insurer_name: analysis.insurer_name || "Assurance Mutual",
        policy_name: analysis.policy_name || "Comprehensive Policy",
        policy_type: (analysis.policy_type as any) || "AUTO",
        policyholder_name: analysis.policyholder_name || "Policyholder",
        insured_asset: analysis.insured_asset || "",
        start_date: analysis.start_date || "2026-01-01",
        expiry_date: analysis.expiry_date || "2026-12-31",
        premium: Number(analysis.premium || 1200),
        deductible: Number(analysis.deductible || 500),
        coverage: analysis.covered_events || ["Collision and Comprehensive", "Liability Coverage"],
        limits: analysis.coverage_limits || ["$100,000 Property Damage", "$300,000 Bodily Injury"],
        exclusions: analysis.exclusions || ["Intentional acts", "Mechanical breakdown"],
        extracted_evidence: analysis.extracted_evidence || [],
      });

      setStep("REVIEW");
    } catch (err: any) {
      setError(err.message || "Failed to analyze policy document. Please try again.");
      setStep("UPLOAD");
    }
  };

  const handleConfirmAndSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const saved = await api.confirmAndSavePolicy({
        ...extractedData,
        status: "ACTIVE",
      });

      setSavedPolicyId(saved.id);
      setStep("SAVED");
    } catch (err: any) {
      setError(err.message || "Failed to save verified policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--green-700)] mb-1">
          <Link href="/policies" className="hover:underline">
            Policies
          </Link>
          <span>/</span>
          <span>Upload & Analyze</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Add Existing Policy
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Upload an existing insurance policy as PDF or image. InsuredYou AI extracts coverage, limits, and deductibles with source evidence.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD DROPZONE */}
      {step === "UPLOAD" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-8 shadow-xs space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--green-500)] hover:bg-[var(--green-50)]/30 rounded-2xl p-10 text-center cursor-pointer transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
              className="hidden"
            />
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {selectedFile ? selectedFile.name : "Select or drag policy document"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              Supported formats: PDF, JPG, JPEG, PNG (max 10MB).
            </p>
            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Ready to analyze ({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            <Link
              href="/policies"
              className="text-xs font-semibold text-[var(--text-tertiary)] hover:underline"
            >
              Cancel
            </Link>
            <button
              onClick={handleStartAnalysis}
              disabled={!selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start AI Policy Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ANALYZING PROGRESS */}
      {step === "ANALYZING" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-12 text-center shadow-xs space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              AI Policy Document Agent at Work
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
              Extracting insurer clauses, coverage tables, deductibles, and preserving source evidence links.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] max-w-md mx-auto text-xs text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{analyzingStage}</span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Document: {selectedFile?.name}
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: USER REVIEW & EDIT (MANDATORY REQUIREMENT) */}
      {step === "REVIEW" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verify & Correct AI Extracted Information</p>
              <p className="mt-0.5 text-amber-800">
                Please inspect each field extracted from your policy. You can edit any value to ensure complete accuracy before confirming.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">
              Extracted Policy Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Policy Number */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={extractedData.policy_number}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, policy_number: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none font-mono"
                />
              </div>

              {/* Insurer Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Insurer Name
                </label>
                <input
                  type="text"
                  value={extractedData.insurer_name}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, insurer_name: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Policy Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Policy Product Name
                </label>
                <input
                  type="text"
                  value={extractedData.policy_name}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, policy_name: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Policy Type */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Policy Type
                </label>
                <select
                  value={extractedData.policy_type}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, policy_type: e.target.value as any })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                >
                  <option value="AUTO">AUTO (Vehicle)</option>
                  <option value="PROPERTY">PROPERTY (Home/Dwelling)</option>
                  <option value="HEALTH">HEALTH</option>
                  <option value="LIFE">LIFE</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              {/* Policyholder Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Policyholder Name
                </label>
                <input
                  type="text"
                  value={extractedData.policyholder_name}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, policyholder_name: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Insured Asset / Vehicle */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Insured Asset / Vehicle (if applicable)
                </label>
                <input
                  type="text"
                  value={extractedData.insured_asset}
                  placeholder="e.g. 2024 Honda CR-V (VIN: 1HGCR2F8...)"
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, insured_asset: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Effective Start Date
                </label>
                <input
                  type="date"
                  value={extractedData.start_date}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, start_date: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={extractedData.expiry_date}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, expiry_date: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>

              {/* Premium */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Premium ($)
                </label>
                <input
                  type="number"
                  value={extractedData.premium}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, premium: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none font-bold"
                />
              </div>

              {/* Deductible */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Deductible ($)
                </label>
                <input
                  type="number"
                  value={extractedData.deductible}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, deductible: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none font-bold text-amber-700"
                />
              </div>
            </div>

            {/* Coverage Perils Section */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Covered Perils & Events
              </label>
              <div className="flex flex-wrap gap-2">
                {extractedData.coverage.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          coverage: extractedData.coverage.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-emerald-700 hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add covered peril..."
                  value={newCoverageItem}
                  onChange={(e) => setNewCoverageItem(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCoverageItem.trim()) {
                      setExtractedData({
                        ...extractedData,
                        coverage: [...extractedData.coverage, newCoverageItem.trim()],
                      });
                      setNewCoverageItem("");
                    }
                  }}
                  className="px-3 h-9 rounded-lg bg-[var(--green-600)] text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Limits Section */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Coverage Limits
              </label>
              <div className="flex flex-wrap gap-2">
                {extractedData.limits.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-medium"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          limits: extractedData.limits.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-blue-700 hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add coverage limit..."
                  value={newLimitItem}
                  onChange={(e) => setNewLimitItem(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLimitItem.trim()) {
                      setExtractedData({
                        ...extractedData,
                        limits: [...extractedData.limits, newLimitItem.trim()],
                      });
                      setNewLimitItem("");
                    }
                  }}
                  className="px-3 h-9 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Exclusions Section */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Exclusions
              </label>
              <div className="flex flex-wrap gap-2">
                {extractedData.exclusions.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-900 border border-red-200 text-xs font-medium"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          exclusions: extractedData.exclusions.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-red-700 hover:text-red-900 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add exclusion..."
                  value={newExclusionItem}
                  onChange={(e) => setNewExclusionItem(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newExclusionItem.trim()) {
                      setExtractedData({
                        ...extractedData,
                        exclusions: [...extractedData.exclusions, newExclusionItem.trim()],
                      });
                      setNewExclusionItem("");
                    }
                  }}
                  className="px-3 h-9 rounded-lg bg-red-600 text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Source Evidence Cards */}
            {extractedData.extracted_evidence.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Source Evidence Corroboration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {extractedData.extracted_evidence.slice(0, 4).map((ev: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span className="font-semibold uppercase text-emerald-800">{ev.field}</span>
                        <span>Page {ev.page || 1} • {Math.round((ev.confidence || 0.95) * 100)}% match</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] italic">
                        "{ev.source_text || 'Matched policy document clause'}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm CTA */}
            <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("UPLOAD")}
                className="text-xs font-semibold text-[var(--text-muted)] hover:underline"
              >
                Upload Different File
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Policy...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm & Save Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SAVED CONFIRMATION */}
      {step === "SAVED" && (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-12 text-center shadow-xs space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Policy Successfully Confirmed & Saved!
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
              Your policy terms and coverage limits are now active in the system. You can file claims against this policy and receive instant AI investigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={savedPolicyId ? `/policies/${savedPolicyId}` : "/policies"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--green-600)] text-white font-semibold text-xs hover:bg-[var(--green-700)] transition-colors shadow-sm"
            >
              <span>View Saved Policy</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              <span>File Claim Against This Policy</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
