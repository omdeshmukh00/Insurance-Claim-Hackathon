"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { api, CreateClaimPayload } from "@/lib/api";

export default function UserNewClaimPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateClaimPayload>({
    policy_number: "",
    claim_type: "AUTO",
    title: "",
    incident_date: new Date().toISOString().split("T")[0],
    claim_amount: 1000,
    description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!formData.policy_number.trim()) {
      setError("Please enter your insurance policy number.");
      return;
    }
    if (!formData.title.trim()) {
      setError("Please enter a short title for this incident.");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      setError("Please provide a description of the incident (at least 5 characters).");
      return;
    }
    if (!formData.incident_date) {
      setError("Please specify the incident date.");
      return;
    }
    if (formData.claim_amount <= 0) {
      setError("Claim amount must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create claim via backend
      const createdClaim = await api.claims.create(formData);

      // 2. Upload supporting documents if any
      if (files.length > 0) {
        for (const file of files) {
          try {
            await api.claims.uploadDocument(createdClaim.id, file, "GENERAL");
          } catch (uploadErr) {
            console.warn("Failed to upload document", file.name, uploadErr);
          }
        }
      }

      // 3. Navigate to created claim view
      router.push(`/user/claims/${createdClaim.id}`);
    } catch (err: any) {
      setError(
        err?.message || "Failed to submit claim. Please check your connection."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/user/claims"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Claims
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
          File a New Claim
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Complete the form below and attach any initial evidence, photos, or police reports.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-start gap-2.5 text-xs text-[var(--color-error-dark)]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
            <CardTitle className="text-sm font-bold">
              Claim & Policy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Policy Number and Claim Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Policy Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POL-AUTO-2026-001"
                  value={formData.policy_number}
                  onChange={(e) =>
                    setFormData({ ...formData, policy_number: e.target.value })
                  }
                  className="w-full h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Claim Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.claim_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      claim_type: e.target.value as CreateClaimPayload["claim_type"],
                    })
                  }
                  className="w-full h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
                >
                  <option value="AUTO">Auto Collision</option>
                  <option value="PROPERTY">Property Damage</option>
                  <option value="HEALTH">Health / Injury</option>
                  <option value="LIFE">Life Insurance</option>
                  <option value="GENERAL">General Liability</option>
                </select>
              </div>
            </div>

            {/* Claim Title */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Incident Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rear-end collision on Highway 101"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
              />
            </div>

            {/* Incident Date & Claim Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Incident Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.incident_date}
                  onChange={(e) =>
                    setFormData({ ...formData, incident_date: e.target.value })
                  }
                  className="w-full h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Estimated Claim Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={formData.claim_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      claim_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full h-9 px-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Incident Details & Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what occurred, vehicles/property involved, road conditions, witnesses, or immediate actions taken…"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 text-xs bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--green-600)]"
              />
            </div>

            {/* Supporting Documents Upload */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Supporting Documents / Images (Optional)
              </label>
              <div className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--green-600)] rounded-[var(--radius-lg)] p-5 text-center transition-colors bg-[var(--bg-subtle)]/30">
                <input
                  type="file"
                  id="claim-files"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="claim-files"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="h-6 w-6 text-[var(--text-muted)]" />
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    Click to browse files or drag and drop
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    PDF, JPG, PNG up to 10MB per file
                  </p>
                </label>
              </div>

              {/* Uploaded File List */}
              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-[var(--green-700)] shrink-0" />
                        <span className="truncate font-medium text-[var(--text-primary)]">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50"
                        title="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-subtle)]/30">
            <Link
              href="/user/claims"
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 text-xs font-semibold rounded-[var(--radius-md)] text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--green-700)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Claim…</span>
                </>
              ) : (
                <span>Submit Claim</span>
              )}
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
