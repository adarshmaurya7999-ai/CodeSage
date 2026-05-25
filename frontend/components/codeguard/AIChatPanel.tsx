"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearChatHistory, loadChatHistory, saveChatHistory } from "@/lib/chat/storage";
import type { ChatMessage } from "@/lib/review/types";
import { usePRData } from "@/hooks/usePRData";
import { ChevronDownIcon, ChevronUpIcon, SendIcon, SparkleIcon } from "./icons";

interface AIChatPanelProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function AIChatPanel({ minimized = false, onToggleMinimize }: AIChatPanelProps) {
  const {
    prView,
    prSessionKey,
    isLivePR,
    findings,
    hasAnalysis,
    analysisSummary,
    selectedFilePath,
  } = usePRData();

  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user?: { login?: string } | null }) => {
        setUserLogin(data.user?.login ?? null);
      })
      .catch(() => setUserLogin(null));
  }, []);

  useEffect(() => {
    if (!prSessionKey || !userLogin) {
      setMessages([]);
      return;
    }
    setMessages(loadChatHistory(prSessionKey, userLogin));
  }, [prSessionKey, userLogin]);

  useEffect(() => {
    if (prSessionKey && userLogin && messages.length > 0) {
      saveChatHistory(prSessionKey, userLogin, messages);
    }
  }, [messages, prSessionKey, userLogin]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleNewChat = useCallback(() => {
    if (prSessionKey && userLogin) {
      clearChatHistory(prSessionKey, userLogin);
    }
    setMessages([]);
    setInput("");
  }, [prSessionKey, userLogin]);

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
      const history = [
        ...messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
        { role: "user" as const, content: question },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          messages: history,
          prContext: isLivePR
            ? {
                repository: prView.repository,
                number: prView.number,
                title: prView.title,
                branch: prView.branch,
                selectedFile: selectedFilePath || prView.filePath,
                analysisSummary,
                findings: hasAnalysis
                  ? findings.map((f) => ({
                      file: f.file,
                      line: f.line,
                      severity: f.severity,
                      title: f.title,
                      description: f.description,
                    }))
                  : [],
              }
            : undefined,
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

  const canChat = isLivePR;
  const placeholder = canChat
    ? "Ask about this PR…"
    : "Load a pull request to start chatting";

  return (
    <div className="chat-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[rgba(34,211,238,0.12)] bg-[var(--bg-surface)]/80">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold">
          <SparkleIcon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
          <span className="text-[var(--accent-cyan)]">AI</span>
          <span className="truncate text-[var(--text-primary)]">Conversation</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {!minimized && messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-violet)]"
            >
              Clear
            </button>
          )}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-cyan)]"
              aria-label={minimized ? "Expand AI conversation" : "Minimize AI conversation"}
            >
              {minimized ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {!minimized && (
        <div
          ref={scrollRef}
          className="scroll-thin chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3"
        >
          {messages.length === 0 && !isSending && (
            <div className="flex h-full min-h-[80px] flex-col items-center justify-center px-2 text-center">
              <p className="text-[12px] text-[var(--text-muted)]">
                {canChat
                  ? "No messages yet. Ask about findings, risk, or a specific file."
                  : "Select a pull request to start a conversation."}
              </p>
            </div>
          )}

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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canChat && handleSend()}
              placeholder={placeholder}
              disabled={isSending || !canChat}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending || !input.trim() || !canChat}
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
