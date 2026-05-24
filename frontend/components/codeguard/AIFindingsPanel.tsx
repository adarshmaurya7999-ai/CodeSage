"use client";

import { findings, type Severity } from "@/lib/mock-data";
import { CommentIcon } from "./icons";

const severityConfig: Record<
  Severity,
  { label: string; pillClass: string }
> = {
  high: { label: "High", pillClass: "severity-pill-high" },
  medium: { label: "Medium", pillClass: "severity-pill-medium" },
  low: { label: "Low", pillClass: "severity-pill-low" },
};

export function AIFindingsPanel() {
  return (
    <section className="mt-5">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
        <span className="ai-glow-header text-[var(--accent-cyan)]">✦</span>
        <span>AI Findings</span>
        <span className="rounded bg-[rgba(34,211,238,0.1)] px-1.5 py-0.5 text-[12px] font-normal text-[var(--accent-cyan)]">
          {findings.length}
        </span>
      </h2>

      <div className="panel-card overflow-hidden">
        {findings.map((finding, index) => {
          const cfg = severityConfig[finding.severity];
          return (
            <article
              key={finding.id}
              className="finding-row group cursor-pointer border-b border-[var(--border)] px-4 py-3.5 transition last:border-b-0 hover:bg-[var(--bg-elevated)]"
              style={{ animationDelay: `${index * 50}ms` }}
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
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    {finding.description}
                  </p>
                  <a
                    href="#"
                    className="mt-2 inline-flex items-center gap-1 font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] hover:underline"
                  >
                    {finding.file}
                    {finding.line ? `:${finding.line}` : ""}
                  </a>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[rgba(34,211,238,0.1)] hover:text-[var(--accent-cyan)]"
                >
                  <CommentIcon />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-3 text-[12px] font-medium text-[var(--accent-blue)] transition hover:text-[var(--accent-cyan)]"
      >
        View all findings →
      </button>
    </section>
  );
}
