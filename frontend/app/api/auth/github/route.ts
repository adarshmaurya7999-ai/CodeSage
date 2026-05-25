import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  getGitHubOAuthConfig,
  getSiteOrigin,
  GITHUB_OAUTH_SCOPES,
  GITHUB_OAUTH_STATE_COOKIE,
} from "@/lib/github/oauth-config";

export const runtime = "nodejs";

/**
 * Starts GitHub OAuth using the CodeSage Local OAuth App (GITHUB_OAUTH_CLIENT_ID).
 * Callback must be registered on GitHub: http://localhost:3000/api/auth/github/callback
 */
export async function GET(request: Request): Promise<NextResponse> {
  const config = getGitHubOAuthConfig();
  if (!config) {
    return NextResponse.redirect(
      `${getSiteOrigin(request.url)}/login?error=auth&reason=${encodeURIComponent(
        "GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET must be set in .env.local",
      )}`,
    );
  }

  const origin = getSiteOrigin(request.url);
  const redirectUri = `${origin}${config.callbackPath}`;
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: GITHUB_OAUTH_SCOPES,
    state,
    allow_signup: "true",
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );

  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
