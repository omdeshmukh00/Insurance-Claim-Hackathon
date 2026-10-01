"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Tags,
  PlusCircle,
  Search,
  Edit2,
  DollarSign,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [editPremium, setEditPremium] = useState<number>(0);
  const [editDeductible, setEditDeductible] = useState<number>(0);
  const [savingPricing, setSavingPricing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.listAdminPolicies();
      setPolicies(data || []);
    } catch (err) {
      console.error("Failed to load admin policies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const openPricingModal = (policy: any) => {
    setEditingPolicy(policy);
    setEditPremium(policy.premium || 0);
    setEditDeductible(policy.deductible || 0);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    try {
      setSavingPricing(true);
      await api.updateAdminPricing(editingPolicy.id, {
        premium: Number(editPremium),
        deductible: Number(editDeductible),
      });
      setSuccessMsg(`Pricing updated for ${editingPolicy.policy_number}`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setEditingPolicy(null);
      await loadPolicies();
    } catch (err: any) {
      alert(err.message || "Failed to update pricing");
    } finally {
      setSavingPricing(false);
    }
  };

  const filtered = policies.filter((p) => {
    return (
      p.policy_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.policy_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.insurer_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Policy Catalog & Pricing Management
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Maintain policy products, underwriting schedules, deductibles, and annual premiums.
          </p>
        </div>

        <Link
          href="/administrator/policies/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Policy Product</span>
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Filter policies by code or product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white border border-[var(--border-subtle)] focus:border-amber-500 outline-none shadow-xs"
        />
      </div>

      {/* Policies Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)]">
          Loading catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[var(--border-default)] p-8">
          <Tags className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-sm font-bold text-[var(--text-primary)]">No policies found</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[var(--border-subtle)] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Policy Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Annual Premium</th>
                <th className="py-3 px-4">Deductible</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((policy) => (
                <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {policy.policy_number}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{policy.policy_name}</p>
                    <p className="text-[11px] text-slate-500">{policy.insurer_name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {policy.policy_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    ${Number(policy.premium || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-800">
                    ${Number(policy.deductible || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {policy.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openPricingModal(policy)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-[11px] font-bold text-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3 text-amber-600" />
                      <span>Edit Pricing</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Pricing & Deductible Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Update Pricing & Deductible
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {editingPolicy.policy_number}
                </p>
              </div>
              <button
                onClick={() => setEditingPolicy(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Annual Premium ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editPremium}
                  onChange={(e) => setEditPremium(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Per-Incident Deductible ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editDeductible}
                  onChange={(e) => setEditDeductible(Number(e.target.value))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 font-bold outline-none text-amber-800"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer"
                >
                  {savingPricing ? "Saving..." : "Save Pricing Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
