import { chatCompletion } from "@/lib/openrouter";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatRequestBody {
  question: string;
  context?: {
    file?: string;
    line?: number;
    comment?: string;
    fix_suggestion?: string | null;
    severity?: string;
    category?: string;
  };
}

/**
 * Ask-the-reviewer chat — OpenRouter (GPT-5.2 Chat) with finding context.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ChatRequestBody;
    if (!body.question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const ctx = body.context;
    const contextBlock = ctx
      ? `
Finding context:
- File: ${ctx.file ?? "unknown"}
- Line: ${ctx.line ?? "unknown"}
- Severity: ${ctx.severity ?? "unknown"}
- Category: ${ctx.category ?? "unknown"}
- Comment: ${ctx.comment ?? ""}
- Suggested fix: ${ctx.fix_suggestion ?? "none"}
`
      : "";

    const answer = await chatCompletion(
      "You are CodeSage AI, an expert code reviewer. Answer concisely about the given PR finding. Reference the file and line when relevant.",
      `${contextBlock}\n\nUser question: ${body.question.trim()}`,
    );

    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
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

    if (status === 404 || message.toLowerCase().includes("model")) {
      return NextResponse.json(
        {
          error:
            "Model not found. Set OPENROUTER_MODEL in .env.local (default: openai/gpt-5.2-chat).",
        },
        { status: 400 },
      );
    }

    if (message.includes("OPENROUTER_API_KEY not configured")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
