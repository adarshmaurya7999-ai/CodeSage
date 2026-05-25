"use client";

import { usePRData } from "@/hooks/usePRData";

export function PROverviewCard() {
  const { prView } = usePRData();
  const rows = [
    { key: "Author", value: prView.author },
    { key: "Created", value: prView.created },
    { key: "Repository", value: prView.repository },
    { key: "Branch", value: prView.branch },
    { key: "PR", value: `#${prView.number} ${prView.title}` },
  ];

  return (
    <div className="panel-card shrink-0 p-3">
      <h3 className="mb-3 font-[family-name:var(--font-jetbrains)] text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        PR Overview
      </h3>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-2 text-[12px]">
            <dt className="shrink-0 text-[var(--text-muted)]">{row.key}</dt>
            <dd className="truncate text-right font-medium text-[var(--text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
