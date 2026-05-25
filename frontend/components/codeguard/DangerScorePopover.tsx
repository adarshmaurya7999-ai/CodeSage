"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePRData } from "@/hooks/usePRData";
import { DangerScoreCard } from "./DangerScoreCard";
import { PROverviewCard } from "./PROverviewCard";

interface DangerScorePopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}

export function DangerScorePopover({ open, onClose, anchorRef }: DangerScorePopoverProps) {
  const { prView, analyzing, hasAnalysis, isLivePR } = usePRData();
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  const showAnalyzing = analyzing && isLivePR;
  const showResults = hasAnalysis && isLivePR;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-[2px]"
        aria-label="Close danger score"
        onClick={onClose}
      />
      <div
        className="danger-popover panel-card fixed z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.15)]"
        style={{ top: position.top, right: position.right }}
        role="dialog"
        aria-labelledby="danger-score-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2
            id="danger-score-title"
            className="font-[family-name:var(--font-jetbrains)] text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-cyan)]"
          >
            Risk analysis
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          {!isLivePR && (
            <p className="py-4 text-center text-[13px] text-[var(--text-muted)]">
              Load a pull request and run analysis to see risk details.
            </p>
          )}
          {showAnalyzing && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-cyan)]" />
              <p className="text-[13px] text-[var(--text-secondary)]">
                Analyzing PR #{prView.number}…
              </p>
            </div>
          )}
          {isLivePR && !showAnalyzing && !showResults && (
            <p className="py-4 text-center text-[13px] text-[var(--text-muted)]">
              Click <strong className="text-[var(--accent)]">Start analysis</strong> to generate a
              danger score.
            </p>
          )}
          {showResults && (
            <>
              <DangerScoreCard />
              <PROverviewCard />
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
