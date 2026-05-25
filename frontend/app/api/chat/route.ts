import { chatCompletion } from "@/lib/openrouter";
import { requireGitHubSession } from "@/lib/github/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface FindingContext {
  file: string;
  line?: number;
  severity: string;
  title: string;
  description?: string;
}

interface ChatRequestBody {
  question: string;
  messages?: ChatMessageInput[];
  prContext?: {
    repository: string;
    number: number;
    title: string;
    branch: string;
    selectedFile?: string;
    analysisSummary?: string | null;
    findings?: FindingContext[];
  };
  context?: {
    file?: string;
    line?: number;
    comment?: string;
    severity?: string;
  };
}

function buildSystemPrompt(): string {
  return `You are CodeSage AI, an expert code reviewer. Answer using only the PR context provided.
Be concise. Reference files and line numbers when relevant. If no PR is loaded, tell the user to select a pull request first.`;
}

function buildUserPrompt(body: ChatRequestBody): string {
  const parts: string[] = [];

  if (body.prContext) {
    const pr = body.prContext;
    parts.push(
      `PR #${pr.number}: ${pr.title}`,
      `Repository: ${pr.repository}`,
      `Branch: ${pr.branch}`,
    );
    if (pr.selectedFile) {
      parts.push(`Currently viewing file: ${pr.selectedFile}`);
    }
    if (pr.analysisSummary) {
      parts.push(`Analysis summary: ${pr.analysisSummary}`);
    }
    if (pr.findings?.length) {
      parts.push(
        "Findings:",
        ...pr.findings.map(
          (f) =>
            `- [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ""} — ${f.title}${f.description ? `: ${f.description}` : ""}`,
        ),
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

    const body = (await req.json()) as ChatRequestBody;
    if (!body.question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const answer = await chatCompletion(buildSystemPrompt(), buildUserPrompt(body));

    return NextResponse.json({ answer });
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
