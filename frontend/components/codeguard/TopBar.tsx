"use client";

import { useRef, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePRData } from "@/hooks/usePRData";
import { BrandLogo } from "./BrandLogo";
import { useDashboardView } from "./DashboardViewContext";
import { NavIcon, SparkleIcon } from "./icons";
import { DangerScorePopover } from "./DangerScorePopover";
import { PRSelectorModal } from "./PRSelectorModal";

const navItems = [
  { id: "team-analytics" as const, label: "Team Analytics", icon: "chart" },
  { id: "pull-requests" as const, label: "Pull Requests", icon: "git-pull" },
  { id: "findings" as const, label: "Findings", icon: "alert" },
];

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
  const { activeNav, openTeamAnalytics, openPrReview } = useDashboardView();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const dangerBtnRef = useRef<HTMLButtonElement>(null);
  const branchName = prView.branch.split(" → ")[0] ?? prView.branch;
  const showPrContext = activeNav !== "team-analytics";

  function openAiChat() {
    window.dispatchEvent(new CustomEvent("codesage:expand-chat"));
    window.setTimeout(() => document.getElementById("ai-chat-input")?.focus(), 320);
  }

  function handleNavClick(id: (typeof navItems)[number]["id"]) {
    if (id === "team-analytics") {
      openTeamAnalytics();
      return;
    }
    if (id === "pull-requests") {
      openPrReview();
      setPrModalOpen(true);
      return;
    }
    if (id === "findings") {
      openPrReview();
      window.dispatchEvent(new CustomEvent("codesage:expand-findings"));
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-panel)]/95 px-4 backdrop-blur-md">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {!showPrContext && (
            <BrandLogo
              as="button"
              onClick={openPrReview}
              aria-label="Back to pull request review"
              className="flex shrink-0"
            />
          )}
          <div
            className={`hidden min-w-0 items-center gap-2 lg:flex ${showPrContext ? "" : "sr-only"}`}
          >
          <div className="hover-lift max-w-[160px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1">
            <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Repository</p>
            <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
              {prView.repository}
            </p>
          </div>
          <div className="hover-lift max-w-[130px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1">
            <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Branch</p>
            <p className="truncate font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-primary)]">
              {branchName}
            </p>
          </div>
          {isLivePR && (
            <div className="hover-lift hidden max-w-[200px] rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 xl:block">
              <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Pull Request</p>
              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                <span className="text-[var(--text-muted)]">#{prView.number}</span> {prView.title}
              </p>
            </div>
          )}
          </div>
        </div>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => handleNavClick(item.id)}
              className={`nav-tab-hover flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] transition ${
                activeNav === item.id
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
          {showPrContext && isLivePR && (
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

          {showPrContext && (
            <button
              ref={dangerBtnRef}
              type="button"
              onClick={() => setDangerOpen((v) => !v)}
              className={`hover-lift flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
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
          )}

          <button
            type="button"
            onClick={openAiChat}
            className="ask-ai-glow hover-lift flex items-center gap-1.5 rounded-md border bg-[rgba(109,40,217,0.2)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-violet)] transition hover:bg-[rgba(109,40,217,0.35)]"
            aria-label="Open AI conversation"
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
