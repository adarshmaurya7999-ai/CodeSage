import type { GitHubSessionUser } from "./session";

function getSessionSecret(): string | null {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();
  return secret || null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bytesToBase64Url(new Uint8Array(signature));
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Tamper-proof session cookie: base64url(payload).hmac (Edge-safe Web Crypto).
 */
export async function encodeSignedSessionCookie(
  user: GitHubSessionUser,
): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(user)));
  const signature = await hmacSha256Base64Url(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function decodeSignedSessionCookie(
  value: string,
): Promise<GitHubSessionUser | null> {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const dot = value.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }

  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = await hmacSha256Base64Url(encoded, secret);

  if (!timingSafeEqualString(signature, expected)) {
    return null;
  }

  try {
    const json = new TextDecoder().decode(base64UrlToBytes(encoded));
    const parsed = JSON.parse(json) as Partial<GitHubSessionUser>;

    if (!parsed.login || typeof parsed.login !== "string") {
      return null;
    }

    return {
      user_id: typeof parsed.user_id === "string" ? parsed.user_id : null,
      github_id: typeof parsed.github_id === "number" ? parsed.github_id : null,
      login: parsed.login,
      name: parsed.name ?? null,
      avatar_url: parsed.avatar_url ?? "",
      email: parsed.email ?? null,
    };
  } catch {
    return null;
  }
}

export async function hasValidSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) {
    return false;
  }
  return (await decodeSignedSessionCookie(value)) != null;
}
