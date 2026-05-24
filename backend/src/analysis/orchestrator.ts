import { buildRiskResult } from "./riskScore";
import { getSupabase, type FindingInsert, type PullRequestInsert } from "../db/supabase";
import { analyzeCode } from "../openrouter/analyzeCode";
import { fetchPRDiff } from "../github/fetchDiff";
import { postAllComments } from "../github/postComments";
import type { Finding } from "../types/finding";

export interface AnalyzePRParams {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  author: string;
  commitSha: string;
  installationId: number;
}

async function saveToSupabase(
  params: AnalyzePRParams,
  riskScore: number,
  riskLevel: string,
  summary: string,
  findings: Finding[],
): Promise<string> {
  const supabase = getSupabase();

  const prInsert: PullRequestInsert = {
    owner: params.owner,
    repo: params.repo,
    pr_number: params.prNumber,
    pr_title: params.prTitle,
    author: params.author,
    risk_score: riskScore,
    risk_level: riskLevel,
    summary,
    commit_sha: params.commitSha,
  };

  const { data: prRow, error: prError } = await supabase
    .from("pull_requests")
    .insert(prInsert)
    .select("id")
    .single();

  if (prError || !prRow) {
    throw new Error(`Failed to save pull_request: ${prError?.message ?? "unknown"}`);
  }

  if (findings.length > 0) {
    const findingRows: FindingInsert[] = findings.map((f) => ({
      pull_request_id: prRow.id,
      severity: f.severity,
      category: f.category,
      owasp_code: f.owasp_code ?? null,
      owasp_name: f.owasp_name ?? null,
      file: f.file,
      line: f.line,
      comment: f.comment,
      fix_suggestion: f.fix_suggestion ?? null,
    }));

    const { error: findingsError } = await supabase.from("findings").insert(findingRows);

    if (findingsError) {
      throw new Error(`Failed to save findings: ${findingsError.message}`);
    }
  }

  return prRow.id;
}

/**
 * Full PR analysis pipeline: diff → OpenRouter → risk → Supabase → GitHub comments.
 */
export async function analyzePR(params: AnalyzePRParams): Promise<void> {
  const { owner, repo, prNumber, installationId, commitSha, prTitle, author } = params;

  console.info(`[analyzePR] Starting ${owner}/${repo}#${prNumber}`);

  const fileDiffs = await fetchPRDiff(owner, repo, prNumber, installationId);
  console.info(`[analyzePR] Fetched ${fileDiffs.length} file diff(s)`);

  const findings = await analyzeCode(fileDiffs, prTitle, author);
  console.info(`[analyzePR] OpenRouter returned ${findings.length} finding(s)`);

  const { score, level, summary } = buildRiskResult(findings);
  console.info(`[analyzePR] Risk score ${score} (${level})`);

  const pullRequestId = await saveToSupabase(params, score, level, summary, findings);
  console.info(`[analyzePR] Saved to Supabase pull_request_id=${pullRequestId}`);

  await postAllComments(
    owner,
    repo,
    prNumber,
    installationId,
    commitSha,
    findings,
    fileDiffs,
    score,
    summary,
  );

  console.info(`[analyzePR] Completed ${owner}/${repo}#${prNumber}`);
}
