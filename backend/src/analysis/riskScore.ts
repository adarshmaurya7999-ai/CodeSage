import type { Finding } from "../types/finding";

export interface RiskResult {
  score: number;
  level: string;
  summary: string;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 25,
  high: 18,
  warning: 12,
  medium: 10,
  low: 5,
  suggestion: 3,
};

function severityWeight(severity: string): number {
  return SEVERITY_WEIGHT[severity.toLowerCase()] ?? 8;
}

function scoreToLevel(score: number): string {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

/**
 * Computes a 0–100 risk score and executive summary from AI findings.
 */
export function buildRiskResult(findings: Finding[]): RiskResult {
  if (findings.length === 0) {
    return {
      score: 0,
      level: "LOW",
      summary:
        "No significant issues detected in this pull request.\nAutomated review found a clean diff with no actionable risks.\nProceed with standard human review before merge.",
    };
  }

  const rawScore = findings.reduce((sum, f) => sum + severityWeight(f.severity), 0);
  const score = Math.min(100, Math.round(rawScore));

  const critical = findings.filter((f) => f.severity.toLowerCase() === "critical").length;
  const security = findings.filter((f) => f.category.toLowerCase() === "security").length;

  const summary = [
    `${findings.length} issue(s) flagged across ${new Set(findings.map((f) => f.file)).size} file(s).`,
    critical > 0
      ? `${critical} critical finding(s) require immediate attention before merge.`
      : security > 0
        ? `${security} security-related finding(s) should be reviewed against OWASP guidance.`
        : "Review warnings and suggestions to reduce regression risk.",
  ].join("\n");

  return {
    score,
    level: scoreToLevel(score),
    summary,
  };
}
