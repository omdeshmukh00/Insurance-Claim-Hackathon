"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Sparkles,
  Shield,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

function NewClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPolicy = searchParams.get("policy") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState(initialPolicy);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentLocation, setIncidentLocation] = useState("");
  const [claimAmount, setClaimAmount] = useState<number | "">("");
  const [claimType, setClaimType] = useState("AUTO");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoadingPolicies(true);
        const data = await api.listPolicies();
        setPolicies(data || []);
        if (data && data.length > 0 && !selectedPolicyNumber) {
          setSelectedPolicyNumber(data[0].policy_number);
          setClaimType(data[0].policy_type || "AUTO");
        }
      } catch (err) {
        console.error("Failed to load user policies", err);
      } finally {
        setLoadingPolicies(false);
      }
    }
    loadPolicies();
  }, [selectedPolicyNumber]);

  const handlePolicyChange = (policyNum: string) => {
    setSelectedPolicyNumber(policyNum);
    const found = policies.find((p) => p.policy_number === policyNum);
    if (found) {
      setClaimType(found.policy_type || "AUTO");
    }
  };

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyNumber) {
      setError("Please select a policy.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and detailed incident description.");
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setError("Please enter a valid estimated claim amount.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create Claim in Backend
      const claim = await api.createClaim({
        policy_number: selectedPolicyNumber,
        title: title.trim(),
        description: description.trim(),
        incident_date: incidentDate,
        incident_location: incidentLocation.trim() || "Declared Location",
        claim_amount: Number(claimAmount),
        claim_type: claimType,
      });

      // 2. Upload any attached supporting documents
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          try {
            await api.uploadClaimDocument(claim.id, file, "ACCIDENT_REPORT");
          } catch (uploadErr) {
            console.warn("Document upload warning:", uploadErr);
          }
        }
      }

      // 3. Navigate immediately to the multi-agent investigation screen
      router.push(`/claims/${claim.id}/investigation`);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim. Please verify information.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <Link
          href="/claims"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--green-700)] hover:underline mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>My Claims</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Submit Insurance Claim
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          File a new loss notice. Our specialized AI agents will autonomously examine policy coverage, check consistency, and correlate evidence.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Policy Selection */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Select Applicable Policy *
            </label>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              Claims are verified exclusively against your authenticated policy schedules.
            </p>

            {loadingPolicies ? (
              <div className="text-xs text-[var(--text-muted)] py-2">Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>No active policies on file. Please upload a policy first.</span>
                <Link
                  href="/policies/upload"
                  className="font-bold underline text-amber-900"
                >
                  Upload Policy
                </Link>
              </div>
            ) : (
              <select
                value={selectedPolicyNumber}
                onChange={(e) => handlePolicyChange(e.target.value)}
                required
                className="w-full h-11 px-3 text-xs font-medium rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.policy_number}>
                    {p.policy_number} — {p.policy_name} ({p.policy_type}) • Deductible: ${p.deductible}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Claim Title */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Incident Summary / Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Rear-end collision on Highway 101"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
            />
          </div>

          {/* Incident Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Incident Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Incident Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Elm Street & 4th Ave, Seattle WA"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Estimated Claim Amount */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Estimated Loss / Claim Amount ($) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 4500"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full h-10 px-3 text-xs font-bold rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Detailed Description of Loss *
            </label>
            <textarea
              rows={4}
              placeholder="Provide chronological facts: what happened, weather/road conditions, other parties involved, damage observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none leading-relaxed"
            />
          </div>

          {/* Supporting Documents & Images Upload */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Supporting Documents & Images
            </label>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Attach police reports, repair estimates, proof of loss, or accident photos.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--green-500)] hover:bg-[var(--green-50)]/30 rounded-xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFilesAdded}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
                className="hidden"
              />
              <UploadCloud className="h-6 w-6 text-emerald-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Click to attach photos or PDF documents
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                PNG, JPG, or PDF up to 10MB each
              </p>
            </div>

            {/* Attached file tags */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs"
                  >
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-emerald-700 hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <Link
              href="/claims"
              className="text-xs font-semibold text-[var(--text-muted)] hover:underline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Claim & Initializing AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Submit Claim & Start AI Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewClaimPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-xs text-[var(--text-muted)]">Loading claim form...</div>}>
      <NewClaimForm />
    </React.Suspense>
  );
}
