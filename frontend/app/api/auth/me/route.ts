import { NextResponse } from "next/server";
import { getGitHubAccessToken, getGitHubSessionUser } from "@/lib/github/session";

export const runtime = "nodejs";

export interface AuthMeUser {
  user_id: string | null;
  github_id: number | null;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  has_token: boolean;
  source: "github";
}

export async function GET(): Promise<NextResponse> {
  const sessionUser = await getGitHubSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ user: null });
  }

  const token = await getGitHubAccessToken();

  const user: AuthMeUser = {
    ...sessionUser,
    has_token: Boolean(token),
    source: "github",
  };

  return NextResponse.json({ user });
}
