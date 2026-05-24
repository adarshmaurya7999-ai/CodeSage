const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

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
 * Calls OpenRouter chat completions and returns the assistant text.
 * @see https://openrouter.ai/docs/quickstart
 */
export async function callOpenRouter(
  prompt: string,
  systemInstruction: string,
  options?: { jsonMode?: boolean },
): Promise<string> {
  const apiKey = requireEnv("OPENROUTER_API_KEY");

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
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8192,
      ...(options?.jsonMode
        ? { response_format: { type: "json_object" as const } }
        : {}),
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    const errMsg =
      data.error?.message ?? `OpenRouter request failed (${response.status})`;
    throw new Error(errMsg);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text.trim();
}

/**
 * Calls OpenRouter and parses JSON into type T.
 */
export async function callOpenRouterJSON<T>(
  prompt: string,
  systemInstruction: string,
): Promise<T> {
  const raw = await callOpenRouter(prompt, systemInstruction);

  try {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("[callOpenRouterJSON] Failed to parse response:");
    console.error(raw);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenRouter returned invalid JSON: ${message}`);
  }
}
