import type { Finding } from "../types/finding";
import { createInstallationOctokit } from "./auth";
import type { FileDiff } from "./fetchDiff";

function formatCommentBody(finding: Finding): string {
  const severity = finding.severity.toUpperCase();
  const category = finding.category.toUpperCase();

  let body = "";

  if (finding.owasp_code && finding.owasp_name) {
    body += `**[${severity}] ${category} — ${finding.owasp_code}: ${finding.owasp_name}**\n\n`;
  } else {
    body += `**[${severity}] ${category}**\n\n`;
  }

  body += finding.comment;

  if (finding.fix_suggestion?.trim()) {
    body += `\n\n\`\`\`suggestion\n${finding.fix_suggestion.trim()}\n\`\`\``;
  }

  return body;
}

function buildValidLineSet(fileDiffs: FileDiff[]): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();

  for (const diff of fileDiffs) {
    map.set(diff.filename, new Set(diff.changedLineNumbers));
  }

  return map;
}

function countSeverities(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const finding of findings) {
    const key = finding.severity.toUpperCase();

    if (key === "CRITICAL") {
      counts.CRITICAL += 1;
    } else if (key === "HIGH" || key === "WARNING") {
      counts.HIGH += 1;
    } else if (key === "MEDIUM") {
      counts.MEDIUM += 1;
    } else {
      counts.LOW += 1;
    }
  }

  return counts;
}

function buildSummaryComment(
  findings: Finding[],
  riskScore: number,
  summary: string,
): string {
  const counts = countSeverities(findings);

  return `## CodeGuard AI — Review Summary

| Severity | Count |
|----------|-------|
| CRITICAL | ${counts.CRITICAL} |
| HIGH     | ${counts.HIGH} |
| MEDIUM   | ${counts.MEDIUM} |
| LOW      | ${counts.LOW} |

**Risk score:** ${riskScore}/100

${summary}
`;
}

/**
 * Posts inline review comments on valid diff lines, with batch + fallback + PR summary.
 */
export async function postAllComments(
  owner: string,
  repo: string,
  pullNumber: number,
  installationId: number,
  commitSha: string,
  findings: Finding[],
  fileDiffs: FileDiff[],
  riskScore: number,
  summary: string,
): Promise<void> {
  const octokit = createInstallationOctokit(installationId);
  const validLines = buildValidLineSet(fileDiffs);

  const valid = findings.filter((finding) => {
    const lines = validLines.get(finding.file);
    return lines !== undefined && lines.has(finding.line);
  });

  console.info(
    `[postComments] ${valid.length}/${findings.length} findings target valid diff lines`,
  );

  if (valid.length === 0) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: buildSummaryComment(findings, riskScore, summary),
    });
    return;
  }

  const comments = valid.map((finding) => ({
    path: finding.file,
    line: finding.line,
    side: "RIGHT" as const,
    body: formatCommentBody(finding),
  }));

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      event: "COMMENT",
      comments,
    });
    console.info(`[postComments] Posted batch review with ${comments.length} comment(s)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[postComments] Batch review failed, falling back to individual comments: ${message}`);

    for (const finding of valid) {
      try {
        await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: pullNumber,
          commit_id: commitSha,
          path: finding.file,
          line: finding.line,
          side: "RIGHT",
          body: formatCommentBody(finding),
        });
      } catch (commentErr) {
        const commentMessage =
          commentErr instanceof Error ? commentErr.message : String(commentErr);
        console.error(
          `[postComments] Skipped comment on ${finding.file}:${finding.line}: ${commentMessage}`,
        );
      }
    }
  }

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body: buildSummaryComment(findings, riskScore, summary),
  });

  console.info("[postComments] Posted PR summary comment");
}
