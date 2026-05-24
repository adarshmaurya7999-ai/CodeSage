"use client";

import { UserMenu } from "@/components/auth/UserMenu";
import { prData } from "@/lib/mock-data";
import { ArrowLeftIcon, SparkleIcon } from "./icons";

function DangerRingMini({ score }: { score: number }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="url(#topDangerGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="danger-ring-animate"
        style={
          {
            "--ring-circumference": circumference,
            "--ring-offset": offset,
          } as React.CSSProperties
        }
      />
      <defs>
        <linearGradient id="topDangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--warning)" />
          <stop offset="100%" stopColor="var(--danger)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[rgba(7,11,22,0.85)] px-5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon className="opacity-70" />
          <span>Pull Requests</span>
        </button>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="rounded px-2 py-0.5 text-[11px] font-semibold text-[#052e1f] bg-[var(--success)]">
          Open
        </span>
      </div>

      <h1 className="pointer-events-none absolute left-1/2 max-w-[40%] -translate-x-1/2 truncate text-[15px]">
        <span className="text-[var(--text-muted)]">#{prData.number}</span>{" "}
        <span className="font-medium text-[var(--text-primary)]">{prData.title}</span>
      </h1>

      <div className="flex items-center gap-3">
        <UserMenu />
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1">
          <span className="text-[11px] text-[var(--text-muted)]">Danger Score</span>
          <DangerRingMini score={prData.dangerScore} />
          <span className="text-[12px] font-semibold text-[var(--danger)]">{prData.riskLabel}</span>
        </div>
        <button
          type="button"
          className="ask-ai-glow flex items-center gap-1.5 rounded-md border bg-[rgba(109,40,217,0.2)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--accent-violet)] transition hover:bg-[rgba(109,40,217,0.35)]"
        >
          <SparkleIcon className="text-[var(--accent-cyan)] drop-shadow-[0_0_6px_var(--accent-cyan)]" />
          Ask AI
        </button>
      </div>
    </header>
  );
}
