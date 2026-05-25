import { NextResponse } from "next/server";
import { requireGitHubSession } from "@/lib/github/session";
import { callOpenRouterJSON } from "@/lib/openrouter/server";
import {
  buildAnalysisFileNote,
  selectFilesForAnalysis,
} from "@/lib/openrouter/selectFilesForAnalysis";
import type { AnalysisResult, PRFile, PullRequest } from "@/lib/github/types";
import type { Finding, Severity } from "@/lib/review/types";

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

const SYSTEM = `You are a senior code reviewer. Return ONLY valid JSON (no markdown) with keys:
findings (array, max 8 items), dangerScore (0-100), riskLabel (short string), summary (one sentence).
Each finding: severity (high|medium|low), category, file, line, comment, fix_suggestion.
Focus on security, bugs, and maintainability. Be concise.`;

function mapSeverity(s: string): Severity {
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

function buildPrompt(body: AnalyzeRequestBody, files: PRFile[]): string {
  const chunks = files
    .map(
      (f) => `FILE: ${f.filename}\nSTATUS: ${f.status}\nPATCH:\n${f.patch ?? ""}`,
    )
    .join("\n\n");

  const fileNote = buildAnalysisFileNote(body.files.length, files.length);

  return `PR #${body.pull.number}: ${body.pull.title}
Author: ${body.pull.user.login}
Branch: ${body.pull.head.ref} → ${body.pull.base.ref}
${fileNote}

${chunks}

Return JSON only.`;
}

function httpStatusForError(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes("credit") || lower.includes("afford") || lower.includes("max_tokens")) {
    return 402;
  }
  if (lower.includes("rate limit")) {
    return 429;
  }
  return 500;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireGitHubSession();

    const body = (await req.json()) as AnalyzeRequestBody;
    if (!body.files?.length) {
      return NextResponse.json({
        findings: [],
        dangerScore: 0,
        riskLabel: "Low Risk",
        summary: "No reviewable file changes.",
      } satisfies AnalysisResult);
    }

    const selected = selectFilesForAnalysis(body.files);
    if (selected.length === 0) {
      return NextResponse.json({
        findings: [],
        dangerScore: 0,
        riskLabel: "Low Risk",
        summary: "No reviewable source files (lockfiles and binaries were skipped).",
      } satisfies AnalysisResult);
    }

    const raw = await callOpenRouterJSON<{
      findings: RawFinding[];
      dangerScore: number;
      riskLabel: string;
      summary: string;
    }>(buildPrompt(body, selected), SYSTEM);

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
      riskLabel:
        raw.riskLabel ??
        (dangerScore >= 70 ? "High Risk" : dangerScore >= 40 ? "Medium Risk" : "Low Risk"),
      summary: raw.summary ?? "Analysis complete.",
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    const status =
      message.includes("Not signed in") || message.includes("not found in database")
        ? 401
        : httpStatusForError(message);
    return NextResponse.json({ error: message }, { status });
  }
}
