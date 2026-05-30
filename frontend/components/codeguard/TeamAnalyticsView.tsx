"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiskTimeline } from "@/components/analytics/RiskTimeline";
import type { TeamAnalyticsPayload, TeamAnalyticsPRRow } from "@/lib/github/teamAnalytics";
import { defaultDateRange } from "@/lib/github/teamAnalytics";

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatRange(since: string, until: string): string {
  return `${formatDateLabel(since)} – ${formatDateLabel(until)}`;
}

function initials(login: string): string {
  const parts = login.replace(/[-_]/g, " ").split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return login.slice(0, 2).toUpperCase();
}

function riskBarWidth(score: number): string {
  return `${Math.min(100, (score / 10) * 100)}%`;
}

function formatResolveHours(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

type SortKey = "riskScore" | "number" | "developer";

export function TeamAnalyticsView() {
  const defaults = defaultDateRange();
  const [since, setSince] = useState(defaults.since);
  const [until, setUntil] = useState(defaults.until);
  const [data, setData] = useState<TeamAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDesc, setSortDesc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ since, until });
      const res = await fetch(`/api/github/team-analytics?${params}`);
      const json = (await res.json()) as TeamAnalyticsPayload & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load analytics");
      }
      setData({
        ...json,
        developers: Array.isArray(json.developers) ? json.developers : [],
        pullRequests: Array.isArray(json.pullRequests) ? json.pullRequests : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [since, until]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedRows = useMemo(() => {
    if (!data?.pullRequests) return [];
    const rows = [...data.pullRequests];
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "riskScore") cmp = a.riskScore - b.riskScore;
      else if (sortKey === "number") cmp = a.number - b.number;
      else cmp = a.developer.localeCompare(b.developer);
      return sortDesc ? -cmp : cmp;
    });
    return rows;
  }, [data, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(key === "riskScore");
    }
  }

  const contributorLabel =
    data && data.meta.totalContributors > data.meta.developersShown
      ? `Showing ${data.meta.developersShown} of ${data.meta.totalContributors} contributors`
      : data
        ? `${data.developers.length} contributor${data.developers.length !== 1 ? "s" : ""}`
        : null;

  return (
    <div className="team-analytics scroll-thin flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-5 py-6 pb-16">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">
            Team Analytics
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Security posture and recurring patterns by developer
          </p>
        </div>

        <div className="team-analytics-date-picker hover-lift flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">From</span>
            <input
              type="date"
              value={since}
              max={until}
              onChange={(e) => setSince(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <span className="mt-4 text-[var(--text-muted)]">–</span>
          <label className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">To</span>
            <input
              type="date"
              value={until}
              min={since}
              onChange={(e) => setUntil(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="hover-glow-accent mt-4 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[#0d0f14] transition disabled:opacity-50"
          >
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-[rgba(255,71,87,0.35)] bg-[rgba(255,71,87,0.08)] px-4 py-3 text-[13px] text-[var(--critical)]">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
          <div className="h-[320px] animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-card)]" />
        </div>
      )}

      {data && (
        <>
          <p className="mb-3 text-[11px] text-[var(--text-muted)]">
            {formatRange(data.dateRange.since, data.dateRange.until)} · {data.reposScanned}{" "}
            repositories · {data.meta.totalPrs} pull requests · {data.meta.note}
          </p>

          {data.developers.length === 0 ? (
            <p className="team-analytics-empty rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
              No repository contributors found. Check that your GitHub token can access the scanned
              repositories.
            </p>
          ) : (
            <>
              {contributorLabel && (
                <p className="mb-3 text-[12px] font-medium text-[var(--text-secondary)]">
                  {contributorLabel}
                  <span className="ml-2 font-normal text-[var(--text-muted)]">
                    Includes repo contributors even without PRs in this range
                  </span>
                </p>
              )}
              <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.developers.map((dev) => (
                <article
                  key={dev.login}
                  className="developer-card team-analytics-dev-card hover-lift panel-card flex flex-col gap-4 p-4"
                >
                  <div className="flex items-center gap-3">
                    {dev.avatarUrl ? (
                      <img
                        src={dev.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-sidebar)] text-[12px] font-bold text-[var(--accent)]">
                        {initials(dev.login)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                        {dev.displayName}
                      </p>
                      {dev.displayName !== dev.login && (
                        <p className="truncate font-[family-name:var(--font-fira-code)] text-[10px] text-[var(--text-muted)]">
                          @{dev.login}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--text-muted)]">{dev.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                        PRs / month
                      </p>
                      <p className="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
                        {dev.prsPerMonth}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                        Avg risk
                      </p>
                      <p className="text-[22px] font-semibold tabular-nums text-[var(--warning)]">
                        {dev.avgRisk}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[var(--border)] pt-3">
                    <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                      Recurring pattern
                    </p>
                    <p className="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">
                      {dev.recurringPattern}
                    </p>
                  </div>
                </article>
              ))}
              </div>
            </>
          )}

          <section className="team-analytics-table-wrap team-analytics-section panel-card shrink-0">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">PR History</h2>
              <span className="text-[11px] text-[var(--text-muted)]">
                {sortedRows.length} record{sortedRows.length !== 1 ? "s" : ""}
              </span>
            </div>

            {sortedRows.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-[var(--text-muted)]">
                No pull requests in range.
              </p>
            ) : (
              <div className="scroll-thin overflow-x-auto">
                <table className="team-analytics-table w-full min-w-[720px] text-left text-[12px]">
                  <thead>
                    <tr className="team-analytics-thead-row border-b border-[var(--border)] text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="px-4 py-2.5 font-medium">PR</th>
                      <th className="px-4 py-2.5 font-medium">Developer</th>
                      <th className="px-4 py-2.5 font-medium">
                        <button
                          type="button"
                          className="hover-text-accent inline-flex items-center gap-1"
                          onClick={() => toggleSort("riskScore")}
                        >
                          Risk score {sortKey === "riskScore" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                      <th className="px-4 py-2.5 font-medium text-center">Critical</th>
                      <th className="px-4 py-2.5 font-medium text-center">High</th>
                      <th className="px-4 py-2.5 font-medium text-center">Medium</th>
                      <th className="px-4 py-2.5 font-medium text-center">Fixes accepted</th>
                      <th className="px-4 py-2.5 font-medium">Time to resolve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => (
                      <PrHistoryRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="team-analytics-timeline-anchor shrink-0 scroll-mt-6">
            <RiskTimeline since={since} until={until} />
          </div>
        </>
      )}
    </div>
  );
}

function PrHistoryRow({ row }: { row: TeamAnalyticsPRRow }) {
  return (
    <tr className="analytics-table-row border-b border-[var(--border)]/60 transition">
      <td className="px-4 py-3">
        <a
          href={row.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-text-accent font-medium text-[var(--text-primary)]"
        >
          #{row.number}
        </a>
        <span className="ml-2 hidden truncate text-[var(--text-muted)] lg:inline">
          {row.owner}/{row.repo}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={row.developerAvatar}
            alt=""
            className="h-6 w-6 rounded-full border border-[var(--border)]"
          />
          <span className="text-[var(--text-secondary)]">{row.developer}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-8 tabular-nums font-semibold text-[var(--text-primary)]">
            {row.riskScore.toFixed(1)}
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-sidebar)]">
            <div
              className="risk-bar-fill h-full rounded-full transition-all duration-500"
              style={{
                width: riskBarWidth(row.riskScore),
                background:
                  row.riskScore >= 7
                    ? "var(--critical)"
                    : row.riskScore >= 4
                      ? "var(--warning)"
                      : "var(--success)",
              }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--critical)]">{row.critical}</td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--warning)]">{row.high}</td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--text-secondary)]">
        {row.medium}
      </td>
      <td className="px-4 py-3 text-center tabular-nums text-[var(--text-secondary)]">
        {row.fixesAccepted}
      </td>
      <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
        {formatResolveHours(row.timeToResolveHours)}
      </td>
    </tr>
  );
}
