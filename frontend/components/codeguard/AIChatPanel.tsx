"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SendIcon, SparkleIcon } from "./icons";

interface AIChatPanelProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  content:
    "I'm your PR reviewer for #243. Ask about line 92, the danger score, or how to fix any finding.",
  timestamp: "Now",
};

const SEED_USER: Message = {
  id: "seed-user",
  role: "user",
  content: "Why is line 92 flagged as high risk?",
  timestamp: "2:34 PM",
};

const SEED_AI: Message = {
  id: "seed-ai",
  role: "ai",
  content:
    "Line 92 calls `gateway.charge()` without an idempotency key. If the gateway accepts the charge but the response times out, a retry could double-charge the customer.",
  timestamp: "2:34 PM",
};

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function AIChatPanel({ minimized = false, onToggleMinimize }: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME, SEED_USER, SEED_AI]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleNewChat = () => {
    setMessages([WELCOME]);
    setInput("");
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const question = input.trim();
    const timestamp = formatTime();

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: question, timestamp },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: {
            file: "src/services/payment-retry.ts",
            line: 92,
            severity: "critical",
            category: "security",
            comment: "Missing idempotency key on retry — duplicate charges possible.",
          },
        }),
      });

      const data = (await res.json()) as { answer?: string; error?: string };
      const reply =
        res.ok && data.answer
          ? data.answer
          : data.error ?? "Something went wrong. Check OPENROUTER_API_KEY in .env.local.";

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "ai", content: reply, timestamp: formatTime() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          content: "Could not reach the reviewer. Is the dev server running?",
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[rgba(34,211,238,0.12)] bg-[var(--bg-surface)]/80">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold">
          <SparkleIcon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
          <span className="text-[var(--accent-cyan)]">AI</span>
          <span className="truncate text-[var(--text-primary)]">Conversation</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {!minimized && (
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-violet)]"
            >
              New chat
            </button>
          )}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-cyan)]"
              aria-label={minimized ? "Expand AI conversation" : "Minimize AI conversation"}
              title={minimized ? "Expand" : "Minimize"}
            >
              {minimized ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {!minimized && (
      <div
        ref={scrollRef}
        className="scroll-thin chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[95%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent-violet)] text-white"
                  : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              }`}
            >
              {msg.content}
            </div>
            <span className="mt-1 px-1 text-[10px] text-[var(--text-muted)]">{msg.timestamp}</span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-start">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse [animation-delay:150ms]">●</span>
                <span className="animate-pulse [animation-delay:300ms]">●</span>
              </span>
            </div>
          </div>
        )}
      </div>
      )}

      {!minimized && (
      <div className="shrink-0 border-t border-[var(--border)] p-2.5">
        <div className="chat-input-bar flex items-center gap-2 rounded-lg px-2.5 py-2">
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about this PR…"
            disabled={isSending}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[#0d0f14] transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
