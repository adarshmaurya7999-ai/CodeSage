"use client";

import { useEffect, useState } from "react";
import { usePRData } from "@/hooks/usePRData";
import { Button } from "@/components/ui";
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
          <span className="shrink-0 text-[var(--accent)]">✦</span>
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
            <Button variant="secondary" size="sm" onClick={handleToggleExpand}>
              {showExpanded ? "Collapse" : "Expand"}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleStartAnalysis()}
            disabled={!canAnalyze}
            loading={analyzing}
            loadingLabel="Analyzing…"
            leftIcon={<span className="text-[14px]" aria-hidden>✦</span>}
          >
            {hasAnalysis ? "Re-run analysis" : "Start analysis"}
          </Button>
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
