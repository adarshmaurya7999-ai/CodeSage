"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RiskTimelineRow } from "@/app/api/analytics/risk-timeline/route";

export interface RiskTimelineChartPoint {
  xLabel: string;
  prNumber: number;
  prTitle: string;
  createdAt: string;
  owner: string;
  repo: string;
  /** Risk score per author login for this PR row */
  scoresByAuthor: Record<string, number>;
}

export interface ContributorStreakStats {
  login: string;
  streak: number;
  improvementLabel: string;
  improvementTone: "positive" | "negative" | "neutral" | "muted";
  latestScore: number | null;
  firstScore: number | null;
}

export interface RiskTimelineSeries {
  login: string;
  color: string;
}

export interface UseRiskTimelineResult {
  loading: boolean;
  error: string | null;
  rows: RiskTimelineRow[];
  chartPoints: RiskTimelineChartPoint[];
  contributors: RiskTimelineSeries[];
  streakStats: ContributorStreakStats[];
  reload: () => void;
}

const LINE_COLORS = ["#00d4aa", "#5352ed", "#ffa502", "#ff6b9d", "#00d4ff"] as const;

function computeStreak(sortedAuthorPrs: RiskTimelineRow[]): number {
  let streak = 0;
  for (let i = sortedAuthorPrs.length - 1; i >= 0; i -= 1) {
    if (sortedAuthorPrs[i].risk_score < 30) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function computeImprovement(
  sortedAuthorPrs: RiskTimelineRow[],
): Pick<ContributorStreakStats, "improvementLabel" | "improvementTone" | "firstScore" | "latestScore"> {
  if (sortedAuthorPrs.length === 0) {
    return {
      improvementLabel: "No PR data",
      improvementTone: "muted",
      firstScore: null,
      latestScore: null,
    };
  }
  if (sortedAuthorPrs.length === 1) {
    return {
      improvementLabel: "First PR",
      improvementTone: "muted",
      firstScore: sortedAuthorPrs[0].risk_score,
      latestScore: sortedAuthorPrs[0].risk_score,
    };
  }

  const first = sortedAuthorPrs[0].risk_score;
  const latest = sortedAuthorPrs[sortedAuthorPrs.length - 1].risk_score;

  if (first === 0) {
    if (latest < first) {
      return {
        improvementLabel: "↓ Improved",
        improvementTone: "positive",
        firstScore: first,
        latestScore: latest,
      };
    }
    if (latest > first) {
      return {
        improvementLabel: "↑ Increased",
        improvementTone: "negative",
        firstScore: first,
        latestScore: latest,
      };
    }
    return {
      improvementLabel: "Stable",
      improvementTone: "neutral",
      firstScore: first,
      latestScore: latest,
    };
  }

  const pct = Math.round(((first - latest) / first) * 100);

  if (latest < first) {
    return {
      improvementLabel: `↓ ${Math.abs(pct)}% improved`,
      improvementTone: "positive",
      firstScore: first,
      latestScore: latest,
    };
  }
  if (latest > first) {
    return {
      improvementLabel: `↑ ${Math.abs(pct)}% increased`,
      improvementTone: "negative",
      firstScore: first,
      latestScore: latest,
    };
  }
  return {
    improvementLabel: "No change",
    improvementTone: "neutral",
    firstScore: first,
    latestScore: latest,
  };
}

function transformRows(rows: RiskTimelineRow[]): {
  chartPoints: RiskTimelineChartPoint[];
  contributors: RiskTimelineSeries[];
  streakStats: ContributorStreakStats[];
} {
  const authors = [...new Set(rows.map((r) => r.author))].sort((a, b) => a.localeCompare(b));

  const contributors: RiskTimelineSeries[] = authors.map((login, index) => ({
    login,
    color: LINE_COLORS[index % LINE_COLORS.length],
  }));

  const chartPoints: RiskTimelineChartPoint[] = rows.map((row) => {
    const scoresByAuthor: Record<string, number> = { [row.author]: row.risk_score };
    return {
      xLabel: `#${row.pr_number}`,
      prNumber: row.pr_number,
      prTitle: row.pr_title,
      createdAt: row.created_at,
      owner: row.owner,
      repo: row.repo,
      scoresByAuthor,
    };
  });

  const streakStats: ContributorStreakStats[] = authors.map((login) => {
    const authorPrs = rows.filter((r) => r.author === login);
    const streak = computeStreak(authorPrs);
    const improvement = computeImprovement(authorPrs);
    return {
      login,
      streak,
      ...improvement,
    };
  });

  return { chartPoints, contributors, streakStats };
}

export function useRiskTimeline(since: string, until: string): UseRiskTimelineResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RiskTimelineRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ since, until });
      const res = await fetch(`/api/analytics/risk-timeline?${params}`);
      const json = (await res.json()) as { rows?: RiskTimelineRow[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load risk timeline");
      }
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load risk timeline");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [since, until]);

  useEffect(() => {
    void load();
  }, [load]);

  const transformed = useMemo(() => transformRows(rows), [rows]);

  return {
    loading,
    error,
    rows,
    chartPoints: transformed.chartPoints,
    contributors: transformed.contributors,
    streakStats: transformed.streakStats,
    reload: load,
  };
}
