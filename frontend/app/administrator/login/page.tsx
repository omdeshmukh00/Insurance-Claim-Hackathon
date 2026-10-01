"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      switchRole("ADMIN");
      router.push("/administrator");
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          InsuredYou Admin Portal
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Operations, underwriter pricing management, and claim settlement authorization
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-8 shadow-xs space-y-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Administrator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-amber-500 outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{loading ? "Authenticating..." : "Log In as Administrator"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--text-tertiary)] hover:underline"
          >
            Return to Policyholder User Experience
          </Link>
        </div>
      </div>
    </div>
  );
}
