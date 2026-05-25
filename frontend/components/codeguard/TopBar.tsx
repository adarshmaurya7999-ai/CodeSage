"use client";

import { useRef, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePRData } from "@/hooks/usePRData";
const navItems = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "pull-requests", label: "Pull Requests", icon: "git-pull", active: true },
  { id: "findings", label: "Findings", icon: "alert" },
  { id: "convos", label: "Conversation", icon: "message" },
] as const;
import { ArrowLeftIcon, NavIcon, SparkleIcon } from "./icons";
import { DangerScorePopover } from "./DangerScorePopover";
import { PRSelectorModal } from "./PRSelectorModal";

function DangerScoreBadge({ score, analyzing }: { score: number; analyzing: boolean }) {
  const tone =
    score >= 70 ? "var(--critical)" : score >= 40 ? "var(--warning)" : "var(--success)";

  if (analyzing) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-sidebar)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </span>
    );
  }

  return (
    <span
      className="danger-score-badge"
      style={{
        background: tone,
        boxShadow: `0 0 14px color-mix(in srgb, ${tone} 55%, transparent)`,
      }}
      aria-label={`Danger score ${score}`}
    >
      {score}
    </span>
  );
}

export function TopBar() {
  const { prView, analyzing, isLivePR } = usePRData();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const dangerBtnRef = useRef<HTMLButtonElement>(null);
  const branchName = prView.branch.split(" → ")[0] ?? prView.branch;

  const focusChat = () => {
    window.dispatchEvent(new CustomEvent("codesage:expand-chat"));
    window.setTimeout(() => document.getElementById("ai-chat-input")?.focus(), 280);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-panel)]/95 px-4 backdrop-blur-md">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPrModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeftIcon className="opacity-70" />
            <span className="hidden sm:inline">Pull Requests</span>
          </button>

          <div className="hidden h-5 w-px bg-[var(--border)] lg:block" />

          <div className="hidden items-center gap-2 lg:flex">
            <div className="max-w-[160px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1">
              <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Repository</p>
              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                {prView.repository}
              </p>
            </div>
            <div className="max-w-[130px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1">
              <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Branch</p>
              <p className="truncate font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-primary)]">
                {branchName}
              </p>
            </div>
            {isLivePR && (
              <div className="hidden max-w-[200px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 xl:block">
                <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Pull Request</p>
                <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                  <span className="text-[var(--text-muted)]">#{prView.number}</span> {prView.title}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => {
                if (item.id === "pull-requests") setPrModalOpen(true);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] transition ${
                item.id === "pull-requests"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-card)]/60 hover:text-[var(--text-secondary)]"
              }`}
            >
              <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isLivePR && (
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                prView.status === "open"
                  ? "text-[#052e1f] bg-[var(--success)]"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              {prView.status === "open" ? "Open" : "Closed"}
            </span>
          )}

          <button
            ref={dangerBtnRef}
            type="button"
            onClick={() => setDangerOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
              dangerOpen
                ? "border-[rgba(255,71,87,0.5)] bg-[rgba(255,71,87,0.1)]"
                : "border-[var(--border-bright)] bg-[var(--bg-card)] hover:border-[rgba(255,71,87,0.4)]"
            }`}
            aria-expanded={dangerOpen}
            aria-haspopup="dialog"
          >
            <span className="hidden text-[11px] font-medium text-[var(--text-secondary)] sm:inline">
              Danger Score
            </span>
            <DangerScoreBadge score={prView.dangerScore} analyzing={analyzing && isLivePR} />
            <span className="text-[12px] font-bold text-[var(--critical)]">{prView.riskLabel}</span>
          </button>

          <button
            type="button"
            onClick={focusChat}
            className="ask-ai-glow hidden items-center gap-1.5 rounded-md border bg-[rgba(109,40,217,0.2)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-violet)] transition hover:bg-[rgba(109,40,217,0.35)] sm:flex"
          >
            <SparkleIcon className="text-[var(--accent-cyan)] drop-shadow-[0_0_6px_var(--accent-cyan)]" />
            Ask AI
          </button>

          <UserMenu />
        </div>
      </header>

      <DangerScorePopover
        open={dangerOpen}
        onClose={() => setDangerOpen(false)}
        anchorRef={dangerBtnRef}
      />

      <PRSelectorModal open={prModalOpen} onClose={() => setPrModalOpen(false)} />
    </>
  );
}
