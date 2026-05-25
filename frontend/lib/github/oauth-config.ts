/** Legacy — cleared on sign-out. Tokens are stored in Supabase `github_tokens`, not cookies. */
export const GITHUB_TOKEN_COOKIE = "codesage_github_token";
export const GITHUB_USER_COOKIE = "codesage_github_user";
export const GITHUB_OAUTH_STATE_COOKIE = "codesage_github_oauth_state";

export const GITHUB_OAUTH_SCOPES = ["read:user", "user:email", "repo", "read:org"].join(" ");

export function getSiteOrigin(requestUrl?: string): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  if (requestUrl) {
    return new URL(requestUrl).origin;
  }
  return "http://localhost:3000";
}

export function getGitHubOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  callbackPath: string;
} | null {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return {
    clientId,
    clientSecret,
    callbackPath: "/api/auth/github/callback",
  };
}

export function isCustomGitHubOAuthEnabled(): boolean {
  return getGitHubOAuthConfig() != null;
}
