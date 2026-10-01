"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, Phone, Mail, Save, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, role, switchRole } = useAuth();
  const [fullName, setFullName] = useState(user.fullName || "Alice Claimant");
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const prof = await api.getProfile();
        if (prof) {
          setFullName(prof.fullName);
          if (prof.phone) setPhone(prof.phone);
        }
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);
      await api.updateProfile({ fullName, phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Account & Profile
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Manage your contact credentials and role context for claims administration.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Identity Banner */}
        <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-200">
            {fullName ? fullName.slice(0, 2).toUpperCase() : "AC"}
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">{fullName}</h2>
            <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mt-1 uppercase">
              Role: {role}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-10 pl-10 pr-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Email Address (Authentication ID)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full h-10 pl-10 pr-3 text-xs rounded-xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 pl-10 pr-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {success && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Profile updated successfully
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>

        {/* Role Switcher Sandbox Box */}
        <div className="pt-6 border-t border-[var(--border-subtle)]">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              <span>Role Context Switcher (Development & Review)</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Test both sides of InsuredYou by toggling your active role. Switching to Administrator role grants access to the operational console (`/administrator`) and settlement controls.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => switchRole("USER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  role === "USER"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                USER (Claimant)
              </button>
              <button
                type="button"
                onClick={() => switchRole("ADMIN")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  role === "ADMIN"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                ADMINISTRATOR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
