const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-5.2-chat";
}

function getMaxTokens(): number {
  const raw = process.env.OPENROUTER_MAX_TOKENS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 2048;
  if (Number.isNaN(parsed) || parsed < 256) {
    return 2048;
  }
  return Math.min(parsed, 4096);
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

export async function callOpenRouterJSON<T>(prompt: string, systemInstruction: string): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const maxTokens = getMaxTokens();

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://codesage.local",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "CodeSage AI",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    const msg = data.error?.message ?? `OpenRouter failed (${response.status})`;
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned) as T;
}
