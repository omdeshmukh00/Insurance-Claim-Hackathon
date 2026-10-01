"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (role === "ADMIN") {
        router.replace("/administrator");
      } else {
        router.replace("/");
      }
    }
  }, [user, role, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({
        email: trimmedEmail,
        password,
      });

      // Role-based redirection governed strictly by the returned user profile
      if (authenticatedUser.role === "ADMIN") {
        router.push("/administrator");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      // User-friendly message instead of raw backend or HTTP status traces
      const msg = err?.message || "Invalid email or password.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Product Identity Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="h-12 w-12 rounded-[var(--radius-xl)] flex items-center justify-center mb-3 shadow-[var(--shadow-sm)]"
            style={{
              background:
                "linear-gradient(135deg, var(--green-700), var(--green-900))",
            }}
          >
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-serif sm:text-2xl">
            Insurance Claims Intelligence
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
            AI-powered claims investigation
          </p>
        </div>

        {/* Minimal Login Card */}
        <div
          className="w-full bg-[var(--bg-card)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-[var(--shadow-md)]"
        >
          <div className="mb-6">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Sign In
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Enter your credentials to access your portal
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="mb-5 p-3 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-start gap-2.5 text-[var(--color-error-dark)] text-xs animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
                className="w-full h-10 px-3 text-sm bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--green-600)] focus:ring-2 focus:ring-[var(--green-600)]/15 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full h-10 pl-3 pr-10 text-sm bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--green-600)] focus:ring-2 focus:ring-[var(--green-600)]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-2 font-medium text-sm rounded-[var(--radius-md)] text-white transition-all shadow-[var(--shadow-sm)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--green-700)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Subtle demo accounts guide */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] text-center">
            <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">
              Select demo account:
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials("claimant@example.com")}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--green-50)] text-[var(--text-secondary)] hover:text-[var(--green-800)] border border-[var(--border-subtle)] transition-colors"
              >
                User (Claimant)
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin@example.com")}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--green-50)] text-[var(--text-secondary)] hover:text-[var(--green-800)] border border-[var(--border-subtle)] transition-colors"
              >
                Admin (Staff)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
