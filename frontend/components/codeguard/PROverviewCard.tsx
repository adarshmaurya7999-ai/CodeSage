"use client";

import { usePRData } from "@/hooks/usePRData";
import { prData as mockPrData } from "@/lib/mock-data";

const labelStyles = {
  violet: "bg-[rgba(139,92,246,0.2)] text-[#c4b5fd] border border-[rgba(139,92,246,0.3)]",
  blue: "bg-[rgba(59,130,246,0.15)] text-[#93c5fd] border border-[rgba(59,130,246,0.25)]",
  slate: "bg-[rgba(148,163,184,0.1)] text-[var(--text-secondary)] border border-[var(--border)]",
};

export function PROverviewCard() {
  const { prView } = usePRData();
  const rows = [
    { key: "Author", value: prView.author },
    { key: "Created", value: prView.created },
    { key: "Repository", value: prView.repository },
    { key: "Branch", value: prView.branch },
  ];

  return (
    <div className="panel-card shrink-0 p-3">
      <h3 className="mb-3 font-[family-name:var(--font-jetbrains)] text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        PR Overview
      </h3>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-2 text-[12px]">
            <dt className="text-[var(--text-muted)]">{row.key}</dt>
            <dd className="truncate text-right font-medium text-[var(--text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mockPrData.labels.map((label) => (
          <span
            key={label.name}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${labelStyles[label.variant]}`}
          >
            {label.name}
          </span>
        ))}
      </div>
    </div>
  );
}
