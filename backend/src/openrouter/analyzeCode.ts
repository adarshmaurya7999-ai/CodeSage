import type { FileDiff } from "../github/fetchDiff";
import type { Finding } from "../types/finding";
import { callOpenRouterJSON } from "./client";

const CHUNK_SIZE = 20;

const SYSTEM_INSTRUCTION = `You are a senior software engineer and security expert with 15 years of experience conducting rigorous pull request code reviews.

You specialize in finding security vulnerabilities (OWASP Top 10), logic bugs, performance bottlenecks, and code quality issues.

You are direct and specific. Always reference the exact file and line number from the provided changed lines.
Always explain WHY something is dangerous and HOW to fix it.

You respond ONLY with valid JSON. No explanations outside the JSON.`;

function buildPrompt(diffs: FileDiff[], prTitle: string, prAuthor: string): string {
  const fileBlocks = diffs
    .map((diff) => {
      const changed =
        diff.changedLineNumbers.length > 0
          ? diff.changedLineNumbers.join(", ")
          : "none";

      return `
=== FILE: ${diff.filename} ===
=== STATUS: ${diff.status} (+${diff.additions} -${diff.deletions}) ===
=== CHANGED LINES: [${changed}] ===

--- PATCH ---
${diff.patch}
`;
    })
    .join("\n");

  return `
PR Title: ${prTitle}
PR Author: ${prAuthor}

Return a JSON array of findings with fields:
severity, category, owasp_code, owasp_name, file, line, comment, fix_suggestion

Rules:
- Only flag real problems
- line must be one of the CHANGED LINES for that file
- For security findings include owasp_code and owasp_name
- fix_suggestion must be ONLY replacement code or null
- If no issues, return []

${fileBlocks}

Return ONLY a valid JSON array.
`.trim();
}

/**
 * Sends PR diffs to OpenRouter (GPT-5.2 Chat) and returns structured findings.
 */
export async function analyzeCode(
  diffs: FileDiff[],
  prTitle: string,
  prAuthor: string,
): Promise<Finding[]> {
  if (diffs.length === 0) {
    return [];
  }

  if (diffs.length <= CHUNK_SIZE) {
    const prompt = buildPrompt(diffs, prTitle, prAuthor);
    const result = await callOpenRouterJSON<Finding[]>(prompt, SYSTEM_INSTRUCTION);
    return Array.isArray(result) ? result : [];
  }

  const chunks: FileDiff[][] = [];
  for (let i = 0; i < diffs.length; i += CHUNK_SIZE) {
    chunks.push(diffs.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      callOpenRouterJSON<Finding[]>(buildPrompt(chunk, prTitle, prAuthor), SYSTEM_INSTRUCTION),
    ),
  );

  return results.flat().filter(Boolean);
}
