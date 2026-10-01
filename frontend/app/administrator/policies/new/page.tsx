"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tags, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function NewAdminPolicyPage() {
  const router = useRouter();

  const [policyNumber, setPolicyNumber] = useState("");
  const [insurerName, setInsurerName] = useState("InsuredYou Mutual Assurance");
  const [policyName, setPolicyName] = useState("");
  const [policyType, setPolicyType] = useState<"AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL">("AUTO");
  const [premium, setPremium] = useState<number | "">("");
  const [deductible, setDeductible] = useState<number | "">("");
  const [coverageInput, setCoverageInput] = useState("Collision Damage, Third-Party Liability, Fire & Theft");
  const [limitsInput, setLimitsInput] = useState("$250,000 Property Damage, $500,000 Bodily Injury");
  const [exclusionsInput, setExclusionsInput] = useState("Unlicensed Operation, Intentional Acts");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNumber.trim() || !policyName.trim() || !premium || !deductible) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.createAdminPolicy({
        policy_number: policyNumber.trim(),
        insurer_name: insurerName.trim(),
        policy_name: policyName.trim(),
        policy_type: policyType,
        policyholder_name: "Portfolio Product Template",
        start_date: startDate,
        expiry_date: expiryDate,
        premium: Number(premium),
        deductible: Number(deductible),
        coverage: coverageInput.split(",").map((s) => s.trim()).filter(Boolean),
        limits: limitsInput.split(",").map((s) => s.trim()).filter(Boolean),
        exclusions: exclusionsInput.split(",").map((s) => s.trim()).filter(Boolean),
        status: "ACTIVE",
      });

      router.push("/administrator/policies");
    } catch (err: any) {
      setError(err.message || "Failed to create policy product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          href="/administrator/policies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Policies Catalog</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Create Policy Product
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Add a new insurance underwriting schedule with default deductibles and coverage limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Policy Identifier Code *</label>
            <input
              type="text"
              placeholder="e.g. POL-AUTO-PREMIUM"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Policy Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Executive Motorist Advantage"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Underwriting Carrier *</label>
            <input
              type="text"
              value={insurerName}
              onChange={(e) => setInsurerName(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Line of Business *</label>
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
            >
              <option value="AUTO">AUTO</option>
              <option value="PROPERTY">PROPERTY</option>
              <option value="HEALTH">HEALTH</option>
              <option value="LIFE">LIFE</option>
              <option value="GENERAL">GENERAL</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Annual Premium ($) *</label>
            <input
              type="number"
              min="0"
              placeholder="1200"
              value={premium}
              onChange={(e) => setPremium(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Standard Deductible ($) *</label>
            <input
              type="number"
              min="0"
              placeholder="500"
              value={deductible}
              onChange={(e) => setDeductible(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 font-bold outline-none text-amber-800"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Covered Perils (comma-separated)</label>
          <input
            type="text"
            value={coverageInput}
            onChange={(e) => setCoverageInput(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Coverage Limits (comma-separated)</label>
          <input
            type="text"
            value={limitsInput}
            onChange={(e) => setLimitsInput(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Exclusions (comma-separated)</label>
          <input
            type="text"
            value={exclusionsInput}
            onChange={(e) => setExclusionsInput(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/administrator/policies" className="text-slate-500 hover:underline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer"
          >
            {saving ? "Saving..." : "Create Policy"}
          </button>
        </div>
      </form>
    </div>
  );
}
