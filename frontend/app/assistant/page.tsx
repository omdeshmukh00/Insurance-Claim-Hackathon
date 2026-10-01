"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  Send,
  Sparkles,
  Shield,
  FileCheck2,
  FileText,
  AlertTriangle,
  Loader2,
  Quote,
  ExternalLink,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  references?: Array<{
    type: "policy" | "claim" | "evidence";
    id: string;
    title: string;
    quote?: string;
  }>;
  suggestedQuestions?: string[];
  timestamp: string;
}

function AssistantChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      sender: "assistant",
      text: `Hello ${user.fullName || "Policyholder"}. I am your InsuredYou AI Claims Assistant. I am grounded in your verified policies and active claims. You can ask me questions about your deductibles, coverage rules, exclusions, or claim statuses.`,
      suggestedQuestions: [
        "Is my car accident covered?",
        "What is my deductible?",
        "Why is my claim under review?",
        "Show me my active policies.",
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || sending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await api.askAssistant({ message: queryText.trim() });

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: response.answer || response.reply || "I analyzed your policy records.",
        references: response.references || [],
        suggestedQuestions: response.suggestedQuestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: `Error retrieving grounded information: ${err.message || "Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                InsuredYou Agent Mode
              </h1>
              <p className="text-[11px] text-[var(--text-muted)]">
                Context-aware retrieval grounded in your verified policies & claims
              </p>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-emerald-800 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          Strict Evidence Grounding
        </span>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                msg.sender === "user"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-xs"
              }`}
            >
              {/* Message text */}
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* References Citations (Agent 9 evidence links) */}
              {msg.references && msg.references.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Grounded Policy / Evidence Citations:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.references.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                          <span>{ref.type}</span>
                          <span className="font-mono">{ref.id}</span>
                        </div>
                        <p className="font-bold text-slate-900 line-clamp-1">{ref.title}</p>
                        {ref.quote && (
                          <p className="text-[10px] text-slate-600 italic">
                            "{ref.quote}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
                  <p className="text-[10px] font-semibold text-slate-500">
                    Suggested Follow-ups:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(q)}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[9px] ${
                  msg.sender === "user" ? "text-emerald-200 text-right" : "text-slate-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="h-7 w-7 rounded-lg bg-emerald-950 text-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="h-7 w-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl p-4 bg-white border border-[var(--border-subtle)] shadow-xs flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Querying user policy and claim context...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleFormSubmit} className="pt-2 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask about your policies, coverage, deductible, or claim status..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="w-full h-12 pl-4 pr-12 text-xs rounded-2xl bg-white border border-[var(--border-subtle)] focus:border-[var(--green-500)] outline-none shadow-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="absolute right-2 h-8 w-8 rounded-xl bg-[var(--green-600)] hover:bg-[var(--green-700)] disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-xs text-[var(--text-muted)]">Loading AI Assistant...</div>}>
      <AssistantChat />
    </React.Suspense>
  );
}
