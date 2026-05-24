const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-5.2-chat";
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
}

/**
 * OpenRouter chat completion (OpenAI-compatible).
 * @see https://openrouter.ai/docs/quickstart
 */
export async function chatCompletion(
  systemInstruction: string,
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://codesage.local",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "CodeSage AI",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    const errMsg =
      data.error?.message ?? `OpenRouter request failed (${response.status})`;
    const err = new Error(errMsg);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text.trim();
}
