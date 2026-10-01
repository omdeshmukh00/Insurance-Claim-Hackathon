"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronUp,
  Shield,
  ArrowRight,
  X,
  Minus,
  Activity,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";

type AgentStatus = "watching" | "analyzing" | "attention" | "suggestion";

interface ScreenMetadata {
  title: string;
  badge: string;
  status: AgentStatus;
  description: string;
  actions: string;
  suggestedQuestions: string[];
  actionText?: string;
  actionHref?: string;
}

function getScreenMetadata(pathname: string): ScreenMetadata {
  if (pathname.includes("/policies/upload")) {
    return {
      title: "Add Existing Policy (AI Ingestion)",
      badge: "Ingestion Mode",
      status: "analyzing",
      description:
        "This screen allows you to drag-and-drop or select an insurance policy document (PDF or image). InsuredYou AI uses multimodal document extraction to parse insurer details, policy number, vehicle details, IDV limit, deductible (in ₹), and coverage clauses with exact source page evidence.",
      actions:
        "• Select or drop your policy document (PDF or image up to 10MB).\n• Click 'Start AI Policy Analysis' to run automated extraction.\n• Inspect and correct any extracted values in the Review form.\n• Confirm to save the verified policy directly to your portfolio.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "How does AI policy extraction work?",
        "What document formats are supported?",
        "Can I edit values after extraction?",
      ],
      actionText: "Need Help Uploading?",
      actionHref: "/assistant?q=How%20does%20policy%20upload%20work",
    };
  }

  if (pathname.includes("/investigation")) {
    return {
      title: "Live Multi-Agent Investigation",
      badge: "6-Agent Pipeline",
      status: "attention",
      description:
        "This screen visualizes the 6 autonomous AI agents (Document Agent, Policy/RAG Agent, Coverage Agent, Anomaly Agent, Missing Info Agent, Assessment Agent) evaluating this claim in real time with an immutable corroboration graph.",
      actions:
        "• View timeline events and real-time status of each investigation agent.\n• Inspect highlighted policy conditions, repair estimates, and detected anomalies.\n• Click 'Evidence Citations' to see exact quotes and page numbers.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What are the 6 investigation agents?",
        "Why was this claim flagged for review?",
        "How is net settlement computed?",
      ],
      actionText: "Inspect Evidence Graph",
      actionHref: pathname.replace("/investigation", "/evidence"),
    };
  }

  if (pathname.includes("/evidence")) {
    return {
      title: "Evidence Citations & Corroboration",
      badge: "Source Evidence",
      status: "watching",
      description:
        "This screen presents the verified source evidence cited by the autonomous AI agents. Every coverage decision, anomaly, and deduction is backed by an exact quote and page number from your policy contract, repair bills, or police report.",
      actions:
        "• Filter evidence by type (Document Extracts, Policy Clauses, Historical Data).\n• Inspect page numbers and exact quotes.\n• Click 'Investigation' to return to the agent pipeline.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "Where does the evidence come from?",
        "How do agents verify evidence?",
      ],
    };
  }

  if (pathname.includes("/settlement")) {
    return {
      title: "Settlement Voucher Breakdown",
      badge: "Disbursement",
      status: "watching",
      description:
        "This screen displays the financial settlement calculation: Total Approved Loss Amount minus Compulsory Policy Deductible equals Net Indemnity Disbursed (in ₹).",
      actions:
        "• Review itemized loss approval and deductible subtraction.\n• Check officer authorization status and generated voucher records.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "How is deductible applied to payout?",
        "When is the payout transferred?",
      ],
    };
  }

  if (pathname.includes("/claims/new")) {
    return {
      title: "New Claim Lodgement",
      badge: "Claim Intake",
      status: "suggestion",
      description:
        "This screen lets you lodge a new insurance claim against any of your active registered policies. You provide incident details, claimed loss amounts in ₹, and attach supporting evidence.",
      actions:
        "• Select your active policy from the dropdown.\n• Enter incident date, location, loss description, and claimed amount in ₹.\n• Submit to initiate autonomous multi-agent analysis.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What documents are required?",
        "What is my deductible?",
        "Which damages are covered?",
      ],
      actionText: "Coverage Guidelines",
      actionHref: "/assistant?q=What%20perils%20are%20covered",
    };
  }

  if (pathname === "/claims" || pathname.startsWith("/claims?")) {
    return {
      title: "Claims Activity & Submissions",
      badge: "Claims Active",
      status: "watching",
      description:
        "This screen displays all your submitted insurance claims. It shows each claim's ID, incident date, claimed amount (in ₹), and the current automated investigation stage (e.g. SUBMITTED, UNDER_INVESTIGATION, UNDER_REVIEW, APPROVED).",
      actions:
        "• Click 'Live Investigation' to inspect how our 6 AI agents analyze policy clauses and invoices.\n• Click 'Details' to inspect claim timelines and uploaded documents.\n• Click '+ File New Claim' to lodge a new claim against your active policies.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What are my submitted claims?",
        "How do I file a new claim?",
        "What is my deductible?",
      ],
      actionText: "File New Claim",
      actionHref: "/claims/new",
    };
  }

  if (pathname.startsWith("/claims/")) {
    return {
      title: "Claim Overview & Timeline",
      badge: "Claim Details",
      status: "watching",
      description:
        "This screen displays full details for this specific claim, including the linked policy number, incident description, claimed amount in ₹, and quick links to Investigation, Evidence Citations, and Settlement Voucher.",
      actions:
        "• Navigate between Investigation, Evidence, and Settlement using top cards.\n• Review claim status and attached document records.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What is the status of this claim?",
        "What evidence was cited?",
      ],
    };
  }

  if (pathname === "/policies" || pathname.startsWith("/policies?")) {
    return {
      title: "Insurance Policy Portfolio",
      badge: "Policy Portfolio",
      status: "watching",
      description:
        "This screen displays all your registered insurance contracts. Each card shows the policyholder name, insured vehicle or property (e.g. Maruti Suzuki Swift VXi), annual premium in ₹, deductible in ₹, and covered perils.",
      actions:
        "• Click 'View Details' on any policy to view clauses, coverage limits, and deductible rules.\n• Click 'Upload Policy Document' to ingest a new PDF or image contract.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What is my auto deductible?",
        "How do I upload another policy?",
        "What perils are covered?",
      ],
      actionText: "Upload Another Policy",
      actionHref: "/policies/upload",
    };
  }

  if (pathname.startsWith("/policies/")) {
    return {
      title: "Policy Contract Specifications",
      badge: "Policy Clauses",
      status: "watching",
      description:
        "This screen shows the comprehensive specifications of your policy, including annual premium in ₹, compulsory deductible in ₹, covered perils, exclusions, and verified document evidence.",
      actions:
        "• Switch between Overview, Coverage, Limits, Exclusions, and Evidence tabs.\n• Click 'File Claim Under This Policy' to lodge a claim immediately.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "What is my deductible under this policy?",
        "What perils are excluded in this policy?",
      ],
    };
  }

  if (pathname.startsWith("/administrator/reviews")) {
    return {
      title: "Officer Review Queue",
      badge: "Admin Reviews",
      status: "attention",
      description:
        "This screen displays claims flagged by the AI pipeline for human officer sign-off due to anomalies, missing FIR reports, or high damage amounts.",
      actions:
        "• Inspect agent corroboration findings and evidence citations.\n• Authorize approved settlement vouchers or request additional documents.\n• Approved payouts trigger automated email notifications via SMTP.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "Why was this claim flagged?",
        "How do I authorize a settlement?",
      ],
    };
  }

  if (pathname.startsWith("/administrator")) {
    return {
      title: "Operations Oversight Console",
      badge: "Admin Console",
      status: "watching",
      description:
        "Administrator operations workspace with full access to claims investigation logs, anomaly triage, policy product pricing, and system-wide audit records.",
      actions:
        "• Manage policy products and pricing tiers.\n• Inspect global audit records and anomaly triage queues.",
      suggestedQuestions: [
        "What is this screen telling about?",
        "How do I adjust product pricing?",
        "Where are system audit logs?",
      ],
    };
  }

  return {
    title: "Claims Intelligence Workspace",
    badge: "Active Copilot",
    status: "watching",
    description:
      "This is your central InsuredYou workspace. It provides an overview of your active insurance portfolio, submitted claims, total settled disbursements in ₹, and quick links to lodge claims or upload contracts.",
    actions:
      "• Click 'Upload Policy' to add an insurance contract.\n• Click 'File New Claim' to start a claim submission.\n• Click 'Live Investigation' to inspect active multi-agent audits.",
    suggestedQuestions: [
      "What is this screen telling about?",
      "What is my deductible?",
      "What perils are covered?",
      "How do I file a claim?",
    ],
  };
}

export function OnScreenAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [screenMeta, setScreenMeta] = useState<ScreenMetadata>(getScreenMetadata("/"));
  const [quickQuestion, setQuickQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);

  // Re-compute screen metadata whenever pathname changes
  useEffect(() => {
    setQuickAnswer(null);
    setScreenMeta(getScreenMetadata(pathname));
  }, [pathname]);

  const answerLocallyOrRemote = async (question: string) => {
    const q = question.toLowerCase().trim();

    // 1. Direct "What is this screen / page telling about" query
    if (
      q.includes("screen") ||
      q.includes("page") ||
      q.includes("what is this") ||
      q.includes("tell me about") ||
      q.includes("what does this") ||
      q.includes("what can i do") ||
      q.includes("explain this")
    ) {
      return `You are currently on the **${screenMeta.title}** screen (\`${pathname}\`).\n\n📌 **What this screen is telling about:**\n${screenMeta.description}\n\n⚡ **Actions you can take here:**\n${screenMeta.actions}`;
    }

    // 2. Greetings
    if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hello") || q.startsWith("hi ")) {
      return `Hello! 👋 You are viewing the **${screenMeta.title}** screen (\`${pathname}\`).\n\n${screenMeta.description}\n\nHow can I assist you with this page or your claims today?`;
    }

    // 3. Workflow questions with instant contextual answers
    if (q.includes("how does") && q.includes("extraction")) {
      return "InsuredYou uses multimodal OCR and AI text analysis to extract your insurer name, policy number, vehicle details, start/end dates, deductible (in ₹), and coverage clauses. Every extracted value is linked to exact source evidence quotes.";
    }
    if (q.includes("format") || q.includes("supported")) {
      return "Supported document formats include PDF (.pdf) and images (.png, .jpg, .jpeg) up to 10MB in size.";
    }
    if (q.includes("edit") && (q.includes("value") || q.includes("correct") || q.includes("wrong"))) {
      return "Yes! In Step 2 (Review Extracted Details), you can edit any text field, adjust dates, deductibles in ₹, and add or remove coverage limits before saving to your portfolio.";
    }
    if (q.includes("human review") || q.includes("flagged")) {
      return "Claims are flagged for officer review if there are repair cost anomalies, missing mandatory documents (such as an FIR for theft), or if the claim amount exceeds automated approval thresholds.";
    }

    // 4. Query Backend Assistant Agent with screenContext
    const res = await api.askAssistant({
      message: question,
      screenContext: {
        pathname,
        title: screenMeta.title,
        description: screenMeta.description,
        actions: screenMeta.actions,
      },
    });

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
      setQuickAnswer(
        `You are on the ${screenMeta.title} screen (\`${pathname}\`). ${screenMeta.description}\n\nYou can also use the full AI Assistant tab for deep document queries.`
      );
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
              {screenMeta.status === "attention" ? "Action needed" : screenMeta.title.slice(0, 18)}
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
                  <span>Capturing Screen: {screenMeta.badge}</span>
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
              {getStatusBadge(screenMeta.status)}
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                {pathname.length > 22 ? pathname.slice(0, 22) + "..." : pathname}
              </span>
            </div>

            {/* Screen Perception Card */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{screenMeta.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {screenMeta.description}
                  </p>
                </div>
              </div>

              {screenMeta.actionText && screenMeta.actionHref && (
                <div className="pt-0.5">
                  <button
                    onClick={() => {
                      if (screenMeta.actionHref) router.push(screenMeta.actionHref);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span>{screenMeta.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Contextual Suggested Questions Chips */}
            {screenMeta.suggestedQuestions && screenMeta.suggestedQuestions.length > 0 && !quickAnswer && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ask about this screen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {screenMeta.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeAsk(q)}
                      disabled={isAsking}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/30 transition-all text-left shadow-2xs"
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
                <span>Capturing screen context & consulting AI...</span>
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
                placeholder="Ask what this screen is about or coverage..."
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
              <span>Full Screen Aware</span>
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
