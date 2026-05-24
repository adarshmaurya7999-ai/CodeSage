const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-5.2-chat";
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
      max_tokens: 8192,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter failed (${response.status})`);
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
