import { normalizeChatRequestBody, type ChatApiRequestBody } from "@/lib/chat/buildChatRequest";
import { chatCompletion } from "@/lib/openrouter";
import { requireGitHubSession } from "@/lib/github/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatRequestBody = ChatApiRequestBody & {
  context?: {
    file?: string;
    line?: number;
    comment?: string;
    severity?: string;
  };
};

function buildSystemPrompt(): string {
  return `You are CodeSage AI, an expert code reviewer for pull requests.

You ALWAYS receive PR metadata and unified diff patches in the user message. Use that code context — never claim you cannot see a file if its diff is provided below.

When explaining issues, structure your reply clearly:
1. **Summary** — one sentence on what is wrong (or that the change looks fine).
2. **Issues** — bullet list; each item must include:
   - **Where:** \`file:line\` (or file region)
   - **What:** the bug, smell, or risk in plain language
   - **Why it matters:** impact (security, correctness, maintainability)
   - **Fix:** concrete suggestion or code direction
3. If prior AI analysis findings are included, reference and expand on them; do not contradict them without reason.

Be direct and helpful. Use markdown sparingly (bold labels as shown). If the user asks a narrow question, answer it but still cite specific lines from the diff.`;
}

function buildUserPrompt(body: ChatRequestBody): string {
  const parts: string[] = [];

  if (body.prContext) {
    const pr = body.prContext;
    parts.push(
      `=== PULL REQUEST ===`,
      `PR #${pr.number}: ${pr.title}`,
      `Repository: ${pr.repository}`,
      `Branch: ${pr.branch}`,
    );
    if (pr.selectedFile) {
      parts.push(`User is focused on file: ${pr.selectedFile}`);
    }
    if (pr.changedFiles?.length) {
      parts.push(`All changed files (${pr.changedFiles.length}): ${pr.changedFiles.join(", ")}`);
    }
    if (pr.analysisSummary) {
      parts.push(`\n=== PRIOR ANALYSIS SUMMARY ===\n${pr.analysisSummary}`);
    }
    if (pr.findings?.length) {
      parts.push(
        "\n=== PRIOR ANALYSIS FINDINGS ===",
        ...pr.findings.map(
          (f) =>
            `- [${f.severity.toUpperCase()}] ${f.file}${f.line ? `:${f.line}` : ""} — ${f.title}${f.description ? `\n  ${f.description}` : ""}`,
        ),
      );
    }
    if (pr.fileDiffs?.length) {
      parts.push("\n=== CODE DIFFS (use this as source of truth) ===");
      for (const file of pr.fileDiffs) {
        parts.push(
          `\n--- FILE: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})${file.isPrimary ? " [PRIMARY - user is viewing this file]" : ""} ---`,
          file.patch,
        );
      }
    } else if (pr.selectedFile) {
      parts.push(
        `\n(No diff text was attached for ${pr.selectedFile}. Answer from findings/summary only, and say if you need the user to re-open the PR.)`,
      );
    }
  }

  if (body.context?.file) {
    parts.push(
      `Focused finding: ${body.context.file}${body.context.line ? `:${body.context.line}` : ""}`,
      body.context.comment ? `Note: ${body.context.comment}` : "",
    );
  }

  if (body.messages?.length) {
    parts.push(
      "Prior conversation:",
      ...body.messages.slice(-8).map((m) => `${m.role}: ${m.content}`),
    );
  }

  parts.push(`User question: ${body.question.trim()}`);
  return parts.filter(Boolean).join("\n");
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireGitHubSession();

    const raw = (await req.json()) as Record<string, unknown> & ChatRequestBody;
    const body = normalizeChatRequestBody(raw);
    if (raw.context) {
      (body as ChatRequestBody).context = raw.context;
    }

    if (!body.question?.trim()) {
      return NextResponse.json(
        { error: "question is required (send `question` or `message` in the JSON body)" },
        { status: 400 },
      );
    }

    const answer = await chatCompletion(buildSystemPrompt(), buildUserPrompt(body as ChatRequestBody));

    return NextResponse.json({ answer, reply: answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";

    if (message.includes("Not signed in") || message.includes("not found in database")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    const status =
      error instanceof Error && "status" in error
        ? (error as Error & { status?: number }).status
        : undefined;

    console.error("[chat]", message);

    if (status === 401 || message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json(
        {
          error:
            "Invalid OpenRouter API key. Set OPENROUTER_API_KEY in .env.local (get one at https://openrouter.ai/keys).",
        },
        { status: 401 },
      );
    }

    if (status === 429 || message.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        {
          error:
            "OpenRouter rate limit reached. Wait a moment and retry, or check usage at https://openrouter.ai/settings.",
        },
        { status: 429 },
      );
    }

    if (message.includes("OPENROUTER_API_KEY not configured")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
