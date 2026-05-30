"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRiskTimeline, type RiskTimelineSeries } from "@/hooks/useRiskTimeline";

export interface RiskTimelineProps {
  since: string;
  until: string;
}

interface FlatChartRow {
  xLabel: string;
  prNumber: number;
  prTitle: string;
  createdAt: string;
  owner: string;
  repo: string;
  [authorLogin: string]: string | number | null;
}

interface TimelineTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number | null;
    color?: string;
    payload?: FlatChartRow;
  }>;
}

function formatChartDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TimelineTooltip({ active, payload }: TimelineTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const entries = payload.filter(
    (p) => p.dataKey && p.value != null && typeof p.value === "number",
  );

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#1a1d26] px-3 py-2 text-[11px] shadow-lg">
      <p className="font-semibold text-[#ffffff]">
        PR #{row.prNumber} · {row.prTitle}
      </p>
      <p className="mt-0.5 text-[#a0a8c0]">{formatChartDate(row.createdAt)}</p>
      <p className="mt-0.5 text-[10px] text-[#a0a8c0]">
        {row.owner}/{row.repo}
      </p>
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.dataKey}</span>
            <span className="tabular-nums font-medium text-[#ffffff]">
              Risk {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[320px] flex-col justify-center gap-6 bg-[#13151c] px-6 py-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-0.5 animate-pulse rounded-full bg-gradient-to-r from-transparent via-[rgba(0,212,170,0.35)] to-transparent"
          style={{ width: `${70 - i * 15}%`, marginLeft: `${i * 8}%` }}
        />
      ))}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-[320px] flex-col items-center justify-center bg-[#13151c] px-4 text-center">
      <svg
        className="mb-3 h-10 w-10 text-[#4a5068]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M4 18l4-6 4 4 4-8 4 6 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[14px] font-medium text-[#a0a8c0]">No PR history yet</p>
      <p className="mt-1 max-w-xs text-[12px] text-[#4a5068]">
        Risk scores will appear here as PRs are reviewed
      </p>
    </div>
  );
}

function contributorInitials(login: string): string {
  const parts = login.replace(/[-_]/g, " ").split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return login.slice(0, 2).toUpperCase();
}

function StreakCard({
  login,
  streak,
  improvementLabel,
  improvementTone,
}: {
  login: string;
  streak: number;
  improvementLabel: string;
  improvementTone: "positive" | "negative" | "neutral" | "muted";
}) {
  const improvementClass =
    improvementTone === "positive"
      ? "text-[#2ed573]"
      : improvementTone === "negative"
        ? "text-[#ff4757]"
        : "text-[#4a5068]";

  return (
    <article
      className={`rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#1a1d26] p-3 transition hover:border-[rgba(0,212,170,0.27)] ${
        streak >= 3 ? "shadow-[0_0_12px_rgba(255,170,0,0.4)]" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#13151c] text-[11px] font-bold text-[#00d4aa]">
          {contributorInitials(login)}
        </span>
        <p className="min-w-0 truncate text-[12px] font-semibold text-[#ffffff]">{login}</p>
      </div>
      <div className="mt-2">
        {streak > 0 ? (
          <p className="text-[18px] font-semibold tabular-nums text-[#ffffff]">
            <span aria-hidden>🔥 </span>
            {streak}
            <span className="ml-1 text-[11px] font-normal text-[#a0a8c0]">PR streak</span>
          </p>
        ) : (
          <p className="text-[12px] text-[#4a5068]">No streak yet</p>
        )}
        <p className={`mt-1 text-[11px] ${improvementClass}`}>{improvementLabel}</p>
      </div>
    </article>
  );
}

function buildFlatChartData(
  chartPoints: ReturnType<typeof useRiskTimeline>["chartPoints"],
  contributors: RiskTimelineSeries[],
): FlatChartRow[] {
  return chartPoints.map((point) => {
    const row: FlatChartRow = {
      xLabel: point.xLabel,
      prNumber: point.prNumber,
      prTitle: point.prTitle,
      createdAt: point.createdAt,
      owner: point.owner,
      repo: point.repo,
    };
    for (const { login } of contributors) {
      row[login] = point.scoresByAuthor[login] ?? null;
    }
    return row;
  });
}

export function RiskTimeline({ since, until }: RiskTimelineProps) {
  const { loading, error, rows, chartPoints, contributors, streakStats } = useRiskTimeline(
    since,
    until,
  );
  const [mineOnly, setMineOnly] = useState(false);
  const [currentLogin, setCurrentLogin] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user?: { login?: string } | null }) => {
        setCurrentLogin(data.user?.login ?? null);
      })
      .catch(() => setCurrentLogin(null));
  }, []);

  const visibleContributors = useMemo(() => {
    if (!mineOnly || !currentLogin) return contributors;
    return contributors.filter((c) => c.login === currentLogin);
  }, [contributors, mineOnly, currentLogin]);

  const flatData = useMemo(
    () => buildFlatChartData(chartPoints, contributors),
    [chartPoints, contributors],
  );

  const showEmpty = !loading && rows.length === 0;

  return (
    <section className="team-analytics-table-wrap team-analytics-section team-analytics-risk-timeline panel-card mt-8 shrink-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">PR Risk Timeline</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Track how code quality evolves over time across your team
          </p>
        </div>
        <div
          className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-0.5 text-[11px]"
          role="group"
          aria-label="Contributor filter"
        >
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              !mineOnly
                ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All Contributors
          </button>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            disabled={!currentLogin}
            className={`rounded-md px-2.5 py-1 font-medium transition disabled:opacity-40 ${
              mineOnly
                ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Mine Only
          </button>
        </div>
      </div>

      {error && (
        <p className="px-4 py-3 text-[12px] text-[var(--critical)]">{error}</p>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 gap-3 border-b border-[var(--border)] p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[88px] animate-pulse rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#1a1d26]"
                  />
                ))
              : streakStats.map((stat) => (
                  <StreakCard
                    key={stat.login}
                    login={stat.login}
                    streak={stat.streak}
                    improvementLabel={stat.improvementLabel}
                    improvementTone={stat.improvementTone}
                  />
                ))}
          </div>

          <div className="scroll-thin overflow-x-auto p-4">
            {loading ? (
              <ChartSkeleton />
            ) : showEmpty ? (
              <EmptyChartState />
            ) : (
              <div className="min-w-[480px]">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={flatData}
                    margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="xLabel"
                      tick={{ fill: "#a0a8c0", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#a0a8c0", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      tickLine={false}
                      label={{
                        value: "Risk Score (lower is better)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#a0a8c0",
                        fontSize: 11,
                        dx: 4,
                      }}
                    />
                    <Tooltip content={<TimelineTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: 16, fontSize: 11, color: "#a0a8c0" }}
                    />
                    <ReferenceLine
                      y={30}
                      stroke="#2ed573"
                      strokeDasharray="6 4"
                      label={{
                        value: "Low Risk",
                        position: "insideTopRight",
                        fill: "#2ed573",
                        fontSize: 10,
                      }}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="#ff4757"
                      strokeDasharray="6 4"
                      label={{
                        value: "High Risk",
                        position: "insideBottomRight",
                        fill: "#ff4757",
                        fontSize: 10,
                      }}
                    />
                    {visibleContributors.map((series) => (
                      <Line
                        key={series.login}
                        type="monotone"
                        dataKey={series.login}
                        name={series.login}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 0, fill: series.color }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                        isAnimationActive
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
