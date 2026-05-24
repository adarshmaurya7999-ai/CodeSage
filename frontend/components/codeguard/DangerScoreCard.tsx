"use client";

"use client";

import { usePRData } from "@/hooks/usePRData";

export function DangerScoreCard() {
  const { prView } = usePRData();
  const score = prView.dangerScore;
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const cx = 36;
  const cy = 36;

  return (
    <div className="panel-card shrink-0 p-3">
      <div className="flex items-center gap-3">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90 shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="5" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#gaugeGradCompact)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="gaugeGradCompact" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--success)" />
              <stop offset="50%" stopColor="var(--warning)" />
              <stop offset="100%" stopColor="var(--danger)" />
            </linearGradient>
          </defs>
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[var(--critical)] font-[family-name:var(--font-jetbrains)] text-[18px] font-bold"
            transform={`rotate(90 ${cx} ${cy})`}
          >
            {score}
          </text>
        </svg>

        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-bold text-[var(--critical)]">{prView.riskLabel}</h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--text-secondary)]">
            Multiple high-severity findings in payment-critical paths.
          </p>
          <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--success) 0%, var(--warning) 50%, var(--danger) 100%)",
              }}
            />
            <div
              className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-sm bg-white"
              style={{ left: `${score}%`, marginLeft: "-1px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
