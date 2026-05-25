import { NextResponse, type NextRequest } from "next/server";
import { saveGitHubAuthToDatabase } from "@/lib/db/github-auth";
import {
  getGitHubOAuthConfig,
  getSiteOrigin,
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_USER_COOKIE,
} from "@/lib/github/oauth-config";
import { encodeSignedSessionCookie } from "@/lib/github/session-cookie";

export const runtime = "nodejs";

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = getSiteOrigin(request.url);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(oauthError)}`,
    );
  }

  const config = getGitHubOAuthConfig();
  if (!config) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent("GitHub OAuth is not configured")}`,
    );
  }

  const savedState = request.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent("Invalid OAuth state. Try signing in again.")}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent("Missing authorization code")}`,
    );
  }

  const redirectUri = `${origin}${config.callbackPath}`;

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = (await tokenRes.json()) as TokenResponse;

  if (!tokenRes.ok || !tokenData.access_token) {
    const msg =
      tokenData.error_description ??
      tokenData.error ??
      "Failed to exchange GitHub authorization code";
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${encodeURIComponent(msg)}`);
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent("Could not load GitHub profile")}`,
    );
  }

  const ghUser = (await userRes.json()) as GitHubUser;

  const stored = await saveGitHubAuthToDatabase(
    {
      githubId: ghUser.id,
      login: ghUser.login,
      name: ghUser.name,
      avatar_url: ghUser.avatar_url,
      email: ghUser.email,
    },
    tokenData.access_token,
  );

  if (!stored) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(
        "Could not save GitHub token to database. Check SUPABASE_SERVICE_KEY and that users/github_tokens tables exist.",
      )}`,
    );
  }

  const response = NextResponse.redirect(`${origin}/dashboard`);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  const sessionPayload = {
    user_id: stored.userId,
    github_id: ghUser.id,
    login: ghUser.login,
    name: ghUser.name,
    avatar_url: ghUser.avatar_url,
    email: ghUser.email,
  };

  const signedSession = await encodeSignedSessionCookie(sessionPayload);
  if (!signedSession) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(
        "Session signing is not configured (SESSION_SECRET or GITHUB_OAUTH_CLIENT_SECRET).",
      )}`,
    );
  }

  response.cookies.set(GITHUB_USER_COOKIE, signedSession, cookieOptions);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });

  return response;
}
