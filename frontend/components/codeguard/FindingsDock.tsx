"use client";

import { useEffect, useState } from "react";
import { usePRData } from "@/hooks/usePRData";
import { AIFindingsPanel } from "./AIFindingsPanel";

export function FindingsDock() {
  const { isLivePR, loadingPR, analyzing, runAnalysis, hasAnalysis, findings, prView } =
    usePRData();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [prView.repository, prView.number]);

  useEffect(() => {
    const expand = () => setExpanded(true);
    window.addEventListener("codesage:expand-findings", expand);
    return () => window.removeEventListener("codesage:expand-findings", expand);
  }, []);

  const canAnalyze = isLivePR && !loadingPR && !analyzing;
  const showExpanded = expanded || analyzing || hasAnalysis;

  async function handleStartAnalysis() {
    if (!canAnalyze) return;
    setExpanded(true);
    await runAnalysis();
  }

  function handleToggleExpand() {
    if (hasAnalysis || analyzing) {
      setExpanded((v) => !v);
    }
  }

  return (
    <div
      className={`findings-dock dock-panel shrink-0 border-t border-[var(--border)] bg-[var(--bg-panel)] ${
        showExpanded ? "" : "dock-panel--minimized"
      }`}
    >
      <div className="findings-dock-bar flex h-[var(--dock-height-minimized,44px)] min-h-[44px] shrink-0 items-center justify-between gap-4 px-5">
        <button
          type="button"
          onClick={handleToggleExpand}
          disabled={!hasAnalysis && !analyzing}
          className="flex min-w-0 items-center gap-2 text-left disabled:cursor-default"
        >
          <span className="ai-glow-header shrink-0 text-[var(--accent)]">✦</span>
          <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
            AI Findings
          </span>
          {hasAnalysis && (
            <span className="shrink-0 rounded bg-[var(--accent-subtle)] px-1.5 py-0.5 text-[11px] font-normal text-[var(--accent)]">
              {findings.length}
            </span>
          )}
          {analyzing && (
            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">Analyzing…</span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {hasAnalysis && (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[var(--border-bright)] hover:text-[var(--text-primary)]"
            >
              {showExpanded ? "Collapse" : "Expand"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleStartAnalysis()}
            disabled={!canAnalyze}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-base)] shadow-[var(--glow-cyan)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-[14px]">✦</span>
            {analyzing ? "Analyzing…" : hasAnalysis ? "Re-run analysis" : "Start analysis"}
          </button>
        </div>
      </div>

      {showExpanded && (
        <div className="findings-dock-body min-h-0 flex-1 overflow-hidden px-5 pb-3">
          <AIFindingsPanel docked />
        </div>
      )}
    </div>
  );
}
