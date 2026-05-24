"use client";

import type { Severity } from "@/lib/mock-data";
import { usePRData } from "@/hooks/usePRData";
import { useReview } from "./ReviewContext";
import { CommentIcon } from "./icons";

const severityConfig: Record<Severity, { label: string; pillClass: string }> = {
  high: { label: "High", pillClass: "severity-pill-high" },
  medium: { label: "Medium", pillClass: "severity-pill-medium" },
  low: { label: "Low", pillClass: "severity-pill-low" },
};

const summaryLabels: Record<Severity, { emoji: string; label: string; className: string }> = {
  high: { emoji: "🔴", label: "Critical", className: "summary-pill--critical" },
  medium: { emoji: "🟡", label: "Medium", className: "summary-pill--medium" },
  low: { emoji: "🟢", label: "Low", className: "summary-pill--low" },
};

export function AIFindingsPanel({ docked = false }: { docked?: boolean }) {
  const { findings, analyzing } = usePRData();
  const { setHighlightedLine } = useReview();

  const counts = findings.reduce(
    (acc, f) => {
      acc[f.severity] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<Severity, number>,
  );

  return (
    <section className={`flex flex-col ${docked ? "h-full min-h-0" : "mt-5"}`}>
      <h2 className="mb-2 flex shrink-0 items-center gap-2 text-[14px] font-semibold text-[var(--text-primary)]">
        <span className="ai-glow-header text-[var(--accent)]">✦</span>
        <span>AI Findings</span>
        <span className="rounded bg-[var(--accent-subtle)] px-1.5 py-0.5 text-[11px] font-normal text-[var(--accent)]">
          {findings.length}
        </span>
        {analyzing && (
          <span className="text-[11px] font-normal text-[var(--text-muted)]">Analyzing…</span>
        )}
      </h2>

      <div className="findings-summary mb-2 shrink-0">
        {(Object.keys(summaryLabels) as Severity[]).map((sev) =>
          counts[sev] > 0 ? (
            <span key={sev} className={`summary-pill ${summaryLabels[sev].className}`}>
              {summaryLabels[sev].emoji} {counts[sev]} {summaryLabels[sev].label}
            </span>
          ) : null,
        )}
      </div>

      <div className="panel-card flex min-h-0 flex-1 flex-col overflow-hidden">
        {analyzing ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-md bg-[var(--bg-sidebar)] px-4 py-4">
                <div className="h-2 w-16 rounded bg-[var(--bg-card)]" />
                <div className="mt-2 h-3 w-full rounded bg-[var(--bg-card)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {findings.map((finding, index) => {
              const cfg = severityConfig[finding.severity];
              return (
                <article
                  key={finding.id}
                  className="finding-row group cursor-pointer border-b border-[var(--border)] px-4 py-3 transition last:border-b-0 hover:bg-[var(--bg-elevated)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHighlightedLine(finding.line ?? null)}
                  onMouseLeave={() => setHighlightedLine(null)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] font-bold uppercase tracking-wider ${cfg.pillClass}`}
                    >
                      {cfg.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-medium leading-snug text-[var(--text-primary)]">
                        {finding.title}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                        {finding.description}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--accent)] group-hover:underline">
                        {finding.file}
                        {finding.line ? `:${finding.line}` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
                    >
                      <CommentIcon />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
