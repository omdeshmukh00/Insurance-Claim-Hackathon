"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Shield,
  ArrowRight,
  X,
  Minus,
  Activity,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2,
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
  suggestedQuestions?: string[];
}

export function OnScreenAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<AgentInsight>({
    status: "watching",
    title: "InsuredYou Copilot Active",
    message: "I am observing your claims workspace and ready to provide contextual evidence assistance.",
    suggestedQuestions: ["What is my deductible?", "What perils are covered?", "How do I file a claim?"],
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
        message: "Upload your policy document (PDF or image). Our AI agent parses insurer details, limits, IDV, deductible, and coverage clauses with exact source evidence citations.",
        tip: "You will have a chance to inspect and edit every extracted field before saving to your portfolio.",
        suggestedQuestions: [
          "How does AI policy extraction work?",
          "What document formats are supported?",
          "Can I edit values after extraction?",
        ],
      });
    } else if (pathname.includes("/investigation")) {
      setInsight({
        status: "attention",
        title: "Live Investigation Pipeline",
        message: "Observing multi-agent claims investigation. Agents cross-reference policy clauses, detect repair bill discrepancies, and flag missing documentation.",
        tip: "Review the Evidence Citations tab to view exact quotes from your policy and invoices.",
        suggestedQuestions: [
          "How are claims investigated?",
          "What causes a human review flag?",
          "How is net settlement computed?",
        ],
      });
    } else if (pathname.includes("/claims/new")) {
      setInsight({
        status: "suggestion",
        title: "New Claim Submission",
        message: "Ensure your incident date falls within your active policy period. Submitting photos and itemized repair estimates enables fast automated adjudication.",
        actionText: "Coverage Guidelines",
        actionHref: "/assistant?q=What%20perils%20are%20covered",
        suggestedQuestions: [
          "What documents are required?",
          "What is my deductible?",
          "Which damages are covered?",
        ],
      });
    } else if (pathname.includes("/settlement")) {
      setInsight({
        status: "watching",
        title: "Settlement Breakdown",
        message: "Reviewing authorized voucher details. Net settlement is computed as total verified loss minus your policy deductible.",
        suggestedQuestions: [
          "How is deductible applied?",
          "When is the payout transferred?",
        ],
      });
    } else if (pathname.startsWith("/administrator/reviews")) {
      setInsight({
        status: "attention",
        title: "Officer Review Queue",
        message: "Claims flagged with anomalies or high loss amounts require officer sign-off. Approved claims trigger formal voucher emails via SMTP.",
        tip: "Approved settlements generate PDF vouchers and audit records.",
        suggestedQuestions: [
          "Why was this claim flagged?",
          "How do I approve this settlement?",
        ],
      });
    } else if (pathname.startsWith("/administrator")) {
      setInsight({
        status: "watching",
        title: "Operations Oversight",
        message: "Administrator Console active with full access to investigation logs, anomaly triage, and audit records.",
        suggestedQuestions: [
          "How do I adjust product pricing?",
          "Where are system audit logs?",
        ],
      });
    } else if (pathname.includes("/policies")) {
      setInsight({
        status: "watching",
        title: "Policy Portfolio",
        message: "Viewing active insurance policies. You can add another policy or click 'View Coverage' to inspect perils and sub-limits.",
        actionText: "Upload Another Policy",
        actionHref: "/policies/upload",
        suggestedQuestions: [
          "What is my auto deductible?",
          "How do I add another policy?",
          "What perils are covered?",
        ],
      });
    } else if (pathname.includes("/claims")) {
      setInsight({
        status: "watching",
        title: "Claims Activity",
        message: "Tracking submitted claims. Each claim undergoes autonomous multi-agent analysis to accelerate adjudication.",
        actionText: "File New Claim",
        actionHref: "/claims/new",
        suggestedQuestions: [
          "How do I check claim status?",
          "What documents are missing?",
        ],
      });
    } else {
      setInsight({
        status: "watching",
        title: "Welcome, " + (user?.fullName?.split(" ")[0] || "Policyholder"),
        message: "InsuredYou Copilot is active. Every recommendation is grounded in verifiable policy evidence.",
        tip: "Ask me anytime about deductibles, coverage rules, or claim status.",
        suggestedQuestions: [
          "What is my deductible?",
          "What perils are covered?",
          "How do I upload a policy?",
        ],
      });
    }
  }, [pathname, user]);

  const answerLocallyOrRemote = async (question: string) => {
    const q = question.toLowerCase().trim();

    // 1. Instant contextual answers for common workflow queries
    if (q.includes("how does") && q.includes("extraction")) {
      return "InsuredYou uses multimodal OCR and AI text analysis to extract your insurer name, policy number, vehicle or property details, start/end dates, deductible, and coverage clauses. Every extracted value is linked to exact source evidence.";
    }
    if (q.includes("format") || q.includes("supported")) {
      return "Supported document formats include PDF (.pdf) and images (.png, .jpg, .jpeg) up to 10MB in size.";
    }
    if (q.includes("edit") && (q.includes("value") || q.includes("correct") || q.includes("wrong"))) {
      return "Yes! In Step 2 (Review Extracted Details), you can edit any text field, adjust dates, deductibles, and add or remove coverage limits before saving to your portfolio.";
    }
    if (q.includes("human review") || q.includes("flagged")) {
      return "Claims are flagged for officer review if there are repair cost anomalies, missing mandatory documents (such as an FIR for theft), or if the claim amount exceeds automated approval thresholds.";
    }
    if (q.includes("how is deductible applied") || q.includes("how is deductible subtracted")) {
      return "The deductible is the initial out-of-pocket amount specified in your policy. Net settlement payout equals: Approved Eligible Damages minus Compulsory Policy Deductible.";
    }

    // 2. Query Backend Assistant Agent
    const res = await api.askAssistant({ message: question });
    return res.answer || (res as any).reply || "Information verified against your policy evidence.";
  };

  const executeAsk = async (questionText: string) => {
    if (!questionText.trim() || isAsking) return;

    setIsAsking(true);
    setQuickAnswer(null);

    try {
      const answer = await answerLocallyOrRemote(questionText);
      setQuickAnswer(answer);
    } catch {
      setQuickAnswer("InsuredYou backend is active. For detailed policy queries, you can also use the full AI Assistant tab.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    const q = quickQuestion;
    setQuickQuestion("");
    await executeAsk(q);
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case "analyzing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Analyzing Screen
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
    <aside aria-label="InsuredYou On-Screen Agent" className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 select-none">
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
        <div className="w-[calc(100vw-24px)] sm:w-96 max-h-[min(540px,calc(100vh-4rem))] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
          {/* Header */}
          <div
            className="p-3.5 flex items-center justify-between text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #175117 0%, #0d2b0d 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">InsuredYou Copilot</h3>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-emerald-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Backend Core Connected</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Minimize Copilot"
                title="Minimize"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Agent"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3.5 space-y-3 bg-slate-50/50 flex-1 overflow-y-auto">
            {/* Status & Current Route */}
            <div className="flex items-center justify-between">
              {getStatusBadge(insight.status)}
              <span className="text-[11px] font-mono text-slate-400">
                {pathname.length > 20 ? pathname.slice(0, 20) + "..." : pathname}
              </span>
            </div>

            {/* Context Card */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{insight.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>

              {insight.tip && (
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{insight.tip}</span>
                </div>
              )}

              {insight.actionText && insight.actionHref && (
                <div className="pt-0.5">
                  <button
                    onClick={() => {
                      if (insight.actionHref) router.push(insight.actionHref);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span>{insight.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Contextual Suggested Questions Chips */}
            {insight.suggestedQuestions && insight.suggestedQuestions.length > 0 && !quickAnswer && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeAsk(q)}
                      disabled={isAsking}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/30 transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isAsking && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Consulting policy intelligence...</span>
              </div>
            )}

            {/* Quick Answer Display */}
            {quickAnswer && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Agent Answer</span>
                  </div>
                  <button
                    onClick={() => setQuickAnswer(null)}
                    className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {quickAnswer}
                </p>
              </div>
            )}

            {/* Quick Question Input */}
            <form onSubmit={handleAsk} className="relative pt-1">
              <input
                type="text"
                placeholder="Ask about this page or your coverage..."
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                disabled={isAsking}
                className="w-full text-xs pl-3 pr-8 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-xs disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isAsking || !quickQuestion.trim()}
                className="absolute right-1.5 top-2.5 h-5 w-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 disabled:opacity-40 transition-colors"
                aria-label="Send query"
              >
                {isAsking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </button>
            </form>
          </div>

          {/* Footer Navigation Link */}
          <div className="px-3.5 py-2 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1 text-[10px]">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Contextual Copilot</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/assistant");
              }}
              className="font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Open Full Assistant →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
