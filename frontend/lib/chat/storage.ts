import type { ChatMessage } from "@/lib/review/types";

const STORAGE_PREFIX = "codesage:chat:";

function storageKey(prKey: string, userLogin: string): string {
  return `${STORAGE_PREFIX}${userLogin}:${prKey}`;
}

export function loadChatHistory(prKey: string, userLogin: string): ChatMessage[] {
  if (typeof window === "undefined" || !prKey || !userLogin) {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey(prKey, userLogin));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(
  prKey: string,
  userLogin: string,
  messages: ChatMessage[],
): void {
  if (typeof window === "undefined" || !prKey || !userLogin) {
    return;
  }
  try {
    localStorage.setItem(storageKey(prKey, userLogin), JSON.stringify(messages));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearChatHistory(prKey: string, userLogin: string): void {
  if (typeof window === "undefined" || !prKey || !userLogin) {
    return;
  }
  localStorage.removeItem(storageKey(prKey, userLogin));
}
