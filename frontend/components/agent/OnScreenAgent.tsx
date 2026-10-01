"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck2,
  FileText,
  Shield,
  HelpCircle,
  ArrowRight,
  X,
  MessageSquare,
  Eye,
  Activity,
  Send,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";

type AgentStatus = "watching" | "analyzing" | "attention" | "suggestion";

interface AgentInsight {
  status: AgentStatus;
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  tip?: string;
}

export function OnScreenAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<AgentInsight>({
    status: "watching",
    title: "InsuredYou Copilot Active",
    message: "I am observing your claims workspace and ready to provide contextual evidence assistance.",
  });
  const [quickQuestion, setQuickQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);

  // Compute contextual intelligence based on active route and application state
  useEffect(() => {
    setQuickAnswer(null);

    if (pathname.includes("/policies/upload")) {
      setInsight({
        status: "analyzing",
        title: "Policy Ingestion Mode",
        message: "You are currently in the policy upload workflow. Once your contract is uploaded, our Policy Document Agent will extract coverages, exclusions, and deductibles.",
        tip: "You will have a chance to manually verify every extracted value before saving.",
        actionText: "Need Help Uploading?",
        actionHref: "/assistant?q=How%20does%20policy%20upload%20work",
      });
    } else if (pathname.includes("/investigation")) {
      setInsight({
        status: "attention",
        title: "Live Investigation Pipeline",
        message: "You are inspecting the 6-agent autonomous claims investigation. Agents verify policy conditions, compare peril clauses, detect anomalies, and flag missing documents.",
        tip: "Look at the Evidence citations tab to see exact page numbers and document quotes.",
      });
    } else if (pathname.includes("/claims/new")) {
      setInsight({
        status: "suggestion",
        title: "New Claim Submission",
        message: "Ensure your incident date falls within your active policy period. Adding repair invoices or police incident reports now will speed up automated processing.",
        actionText: "Coverage Guidelines",
        actionHref: "/assistant?q=What%20perils%20are%20covered",
      });
    } else if (pathname.includes("/settlement")) {
      setInsight({
        status: "watching",
        title: "Settlement Breakdown",
        message: "Reviewing authorized voucher details. The net settlement reflects total approved loss minus your policy deductible.",
      });
    } else if (pathname.startsWith("/administrator/reviews")) {
      setInsight({
        status: "attention",
        title: "Officer Review Queue",
        message: "Claims flagged with anomalies, missing documents, or values over auto-settlement limits require your formal authorization.",
        tip: "Approved settlements trigger an automated formal voucher email via Gmail SMTP.",
      });
    } else if (pathname.startsWith("/administrator/policies")) {
      setInsight({
        status: "watching",
        title: "Product & Pricing Catalog",
        message: "Managing policy products and pricing tiers. Modifications to premiums and deductibles apply immediately to new policyholders.",
      });
    } else if (pathname.startsWith("/administrator")) {
      setInsight({
        status: "watching",
        title: "Operations Oversight",
        message: "Administrator Console active with full access to claims investigation logs, anomaly triage, and audit records.",
      });
    } else if (pathname.includes("/policies")) {
      setInsight({
        status: "watching",
        title: "Policy Portfolio",
        message: "Viewing your active insurance policies. You can add previous coverage contracts or click 'View Coverage' to see covered perils and sub-limits.",
        actionText: "Upload Another Policy",
        actionHref: "/policies/upload",
      });
    } else if (pathname.includes("/claims")) {
      setInsight({
        status: "watching",
        title: "Claims Activity",
        message: "Tracking submitted claims. Each claim undergoes autonomous multi-agent analysis to accelerate fair adjudication.",
        actionText: "File New Claim",
        actionHref: "/claims/new",
      });
    } else {
      setInsight({
        status: "watching",
        title: "Welcome, " + (user?.fullName?.split(" ")[0] || "Policyholder"),
        message: "InsuredYou is monitoring your claims intelligence environment. Every recommendation is strictly grounded in verifiable policy evidence.",
        tip: "Ask me anytime about deductibles, coverage rules, or claim status.",
      });
    }
  }, [pathname, user]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim() || isAsking) return;

    setIsAsking(true);
    setQuickAnswer(null);

    try {
      const res = await api.askAssistant({ message: quickQuestion });
      setQuickAnswer(res.answer || res.reply || "Information verified.");
    } catch {
      setQuickAnswer("Unable to query assistant at this moment. Please try the AI Assistant tab.");
    } finally {
      setIsAsking(false);
    }
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case "analyzing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Analyzing UI State
          </span>
        );
      case "attention":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            Attention Needed
          </span>
        );
      case "suggestion":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Suggestion
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active Copilot
          </span>
        );
    }
  };

  return (
    <aside aria-label="InsuredYou On-Screen Agent" className="fixed bottom-5 right-5 z-50 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border"
          style={{
            background: "linear-gradient(135deg, #175117 0%, #0d2b0d 100%)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
          aria-label="Open InsuredYou Copilot"
        >
          <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40 text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">InsuredYou Agent</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[10px] text-emerald-200/80 font-medium">
              {insight.status === "attention" ? "Action needed" : "Contextual Help"}
            </p>
          </div>
          <ChevronUp className="h-4 w-4 text-emerald-200/70 ml-1 group-hover:translate-y-[-2px] transition-transform" />
        </button>
      ) : (
        <div className="w-88 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between text-white"
            style={{ background: "linear-gradient(135deg, #175117 0%, #0d2b0d 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">InsuredYou Agent</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                    Live UI Copilot
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/75">
                  Contextual Claims Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Agent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5 bg-slate-50/50 max-h-96 overflow-y-auto">
            {/* Status & Current View Indicator */}
            <div className="flex items-center justify-between">
              {getStatusBadge(insight.status)}
              <span className="text-[11px] font-mono text-slate-500">
                {pathname.slice(0, 24)}
              </span>
            </div>

            {/* Context Card */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <Activity className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{insight.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>

              {insight.tip && (
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{insight.tip}</span>
                </div>
              )}

              {insight.actionText && insight.actionHref && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      if (insight.actionHref) router.push(insight.actionHref);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span>{insight.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Answer Display */}
            {quickAnswer && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Agent Answer</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{quickAnswer}</p>
              </div>
            )}

            {/* Quick Question Input */}
            <form onSubmit={handleAsk} className="relative">
              <input
                type="text"
                placeholder="Ask about your coverage or this page..."
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                className="w-full text-xs pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={isAsking || !quickQuestion.trim()}
                className="absolute right-1.5 top-1.5 h-6 w-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 disabled:opacity-40 transition-colors"
                aria-label="Send query"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>

          {/* Footer Navigation link */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>DOM & Route State Only</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/assistant");
              }}
              className="font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Full Assistant →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
