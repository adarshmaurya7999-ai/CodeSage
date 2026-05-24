import { NextResponse } from "next/server";
import { callOpenRouterJSON } from "@/lib/openrouter/server";
import type { AnalysisResult, PRFile, PullRequest } from "@/lib/github/types";
import type { Finding, Severity } from "@/lib/mock-data";

export const runtime = "nodejs";

interface AnalyzeRequestBody {
  owner: string;
  repo: string;
  pull: PullRequest;
  files: PRFile[];
}

interface RawFinding {
  severity: string;
  category?: string;
  file: string;
  line: number;
  comment: string;
  fix_suggestion?: string | null;
}

const SYSTEM = `You are a senior code reviewer. Return ONLY valid JSON with keys:
findings (array), dangerScore (0-100 number), riskLabel (string), summary (one sentence).
Each finding: severity (high|medium|low), category, file, line, comment, fix_suggestion.`;

function mapSeverity(s: string): Severity {
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

function buildPrompt(body: AnalyzeRequestBody): string {
  const chunks = body.files
    .filter((f) => f.patch)
    .slice(0, 15)
    .map(
      (f) => `FILE: ${f.filename}\nSTATUS: ${f.status}\nPATCH:\n${f.patch?.slice(0, 4000) ?? ""}`,
    )
    .join("\n\n");

  return `PR #${body.pull.number}: ${body.pull.title}
Author: ${body.pull.user.login}
Branch: ${body.pull.head.ref} → ${body.pull.base.ref}

${chunks}

Return JSON only.`;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    if (!body.files?.length) {
      return NextResponse.json({
        findings: [],
        dangerScore: 0,
        riskLabel: "Low Risk",
        summary: "No reviewable file changes.",
      } satisfies AnalysisResult);
    }

    const raw = await callOpenRouterJSON<{
      findings: RawFinding[];
      dangerScore: number;
      riskLabel: string;
      summary: string;
    }>(buildPrompt(body), SYSTEM);

    const findings: Finding[] = (raw.findings ?? []).map((f, i) => ({
      id: `gh-${i}`,
      severity: mapSeverity(f.severity),
      title: f.comment.slice(0, 80),
      description: f.comment,
      file: f.file,
      line: f.line,
    }));

    const dangerScore = Math.min(100, Math.max(0, Math.round(raw.dangerScore ?? 0)));
    const result: AnalysisResult = {
      findings,
      dangerScore,
      riskLabel: raw.riskLabel ?? (dangerScore >= 70 ? "High Risk" : dangerScore >= 40 ? "Medium Risk" : "Low Risk"),
      summary: raw.summary ?? "Analysis complete.",
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
