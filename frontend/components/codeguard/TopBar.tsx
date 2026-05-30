"use client";

import { useRef, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePRData } from "@/hooks/usePRData";
import { BrandLogo } from "./BrandLogo";
import { useDashboardView } from "./DashboardViewContext";
import { AskSageButton } from "./AskSageButton";
import { NavIcon } from "./icons";
import { DangerScorePopover } from "./DangerScorePopover";
import { PRSelectorModal } from "./PRSelectorModal";

const navItems = [
  { id: "team-analytics" as const, label: "Team Analytics", icon: "chart" },
  { id: "pull-requests" as const, label: "Pull Requests", icon: "git-pull" },
  { id: "findings" as const, label: "Findings", icon: "alert" },
] as const;

function DangerScoreBadge({ score, analyzing }: { score: number; analyzing: boolean }) {
  const tone =
    score >= 70 ? "var(--critical)" : score >= 40 ? "var(--warning)" : "var(--success)";

  if (analyzing) {
    return (
      <span className="top-bar__danger-badge top-bar__danger-badge--loading">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </span>
    );
  }

  return (
    <span
      className="top-bar__danger-badge"
      style={{
        background: tone,
        boxShadow: `0 0 6px color-mix(in srgb, ${tone} 30%, transparent)`,
      }}
      aria-label={`Danger score ${score}`}
    >
      {score}
    </span>
  );
}

function ContextChip({
  label,
  value,
  mono,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`top-bar__chip nav-pop hover-lift ${className} ${!value || value === "—" ? "top-bar__chip--empty" : ""}`}
    >
      <span className="top-bar__chip-label">{label}</span>
      <span
        className={`top-bar__chip-value ${mono ? "top-bar__chip-value--mono" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
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
  const prTitle = isLivePR ? `#${prView.number} ${prView.title}` : "—";

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
      <header className="top-bar">
        <div className="top-bar__zone top-bar__zone--left">
          {showPrContext ? (
            <>
              <div className="top-bar__identity hidden shrink-0 md:flex">
                <BrandLogo size="sm" className="top-bar__brand" />
              </div>
              <div className="top-bar__context-panel" role="group" aria-label="Pull request context">
                <ContextChip
                  label="Repository"
                  value={prView.repository || "—"}
                  className="top-bar__chip--repo"
                />
                <ContextChip
                  label="Branch"
                  value={branchName || "—"}
                  mono
                  className="top-bar__chip--branch"
                />
                <ContextChip
                  label="Pull Request"
                  value={prTitle}
                  className="top-bar__chip--pr"
                />
              </div>
            </>
          ) : (
            <BrandLogo
              as="button"
              onClick={openPrReview}
              aria-label="Back to pull request review"
              className="shrink-0"
            />
          )}
        </div>

        <nav className="top-bar__zone top-bar__zone--center" aria-label="Main">
          <div className="top-bar__nav-pill">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => handleNavClick(item.id)}
                className={`top-bar__nav-item nav-pop nav-tab-hover ${
                  activeNav === item.id ? "top-bar__nav-item--active" : ""
                }`}
              >
                <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="top-bar__zone top-bar__zone--right">
          <div className="top-bar__actions">
            {showPrContext && isLivePR && (
              <span
                className={`top-bar__status ${
                  prView.status === "open" ? "top-bar__status--open" : "top-bar__status--closed"
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
                className={`top-bar__danger nav-pop hover-lift ${dangerOpen ? "top-bar__danger--open" : ""}`}
                aria-expanded={dangerOpen}
                aria-haspopup="dialog"
              >
                <span className="top-bar__danger-label">Risk</span>
                <DangerScoreBadge score={prView.dangerScore} analyzing={analyzing && isLivePR} />
                <span className="top-bar__danger-risk" title={prView.riskLabel}>
                  {prView.riskLabel}
                </span>
              </button>
            )}

            <AskSageButton onClick={openAiChat} className="top-bar__ask-sage" />

            <UserMenu compact />
          </div>
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
