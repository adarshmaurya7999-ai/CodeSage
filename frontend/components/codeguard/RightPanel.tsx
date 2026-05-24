import { AIChatPanel } from "./AIChatPanel";
import { DangerScoreCard } from "./DangerScoreCard";
import { PROverviewCard } from "./PROverviewCard";

export function RightPanel() {
  return (
    <aside className="right-panel-shell flex h-full w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[rgba(14,21,38,0.95)] backdrop-blur-md">
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-2.5">
        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent-cyan)]">
          Intelligence
        </span>
      </div>

      {/* Grid: overview + risk fixed height; chat fills remaining space */}
      <div className="right-panel-body grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-2.5 overflow-hidden p-2.5">
        <div className="min-h-0 shrink-0 overflow-hidden">
          <PROverviewCard />
        </div>

        <div className="min-h-0 shrink-0 overflow-hidden">
          <DangerScoreCard />
        </div>

        <div className="flex min-h-0 overflow-hidden">
          <AIChatPanel />
        </div>
      </div>
    </aside>
  );
}
