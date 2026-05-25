import { cookies } from "next/headers";
import {
  getGitHubTokenByLogin,
  getGitHubTokenByUserId,
} from "@/lib/db/github-auth";
import { GITHUB_USER_COOKIE } from "./oauth-config";
import { decodeSignedSessionCookie } from "./session-cookie";

export interface GitHubSessionUser {
  user_id: string | null;
  github_id: number | null;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

/**
 * Signed-in GitHub user from verified session cookie (token lives in DB).
 */
export async function getGitHubSessionUser(): Promise<GitHubSessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GITHUB_USER_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  return await decodeSignedSessionCookie(raw);
}

/**
 * GitHub OAuth access token from `github_tokens`, keyed by verified session user.
 */
export async function getGitHubAccessToken(): Promise<string | null> {
  const sessionUser = await getGitHubSessionUser();
  if (!sessionUser) {
    return null;
  }

  if (sessionUser.user_id) {
    const byUserId = await getGitHubTokenByUserId(sessionUser.user_id);
    if (byUserId) {
      return byUserId;
    }
  }

  return getGitHubTokenByLogin(sessionUser.login);
}

export async function requireGitHubAccessToken(): Promise<string> {
  const token = await getGitHubAccessToken();
  if (!token) {
    throw new Error(
      "GitHub token not found. Sign out and sign in again so your token is saved to the database.",
    );
  }
  return token;
}

/**
 * Session user + DB token for protected API routes.
 */
export async function requireGitHubSession(): Promise<{
  token: string;
  user: GitHubSessionUser;
}> {
  const user = await getGitHubSessionUser();
  if (!user) {
    throw new Error("Not signed in. Use “Continue with GitHub” on the login page.");
  }

  const token = await getGitHubAccessToken();
  if (!token) {
    throw new Error(
      "GitHub token not found in database. Sign out and sign in again.",
    );
  }

  return { token, user };
}
