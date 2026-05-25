import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteGitHubTokenByLogin, deleteGitHubTokenByUserId } from "@/lib/db/github-auth";
import { createClient } from "@/lib/supabase/server";
import {
  getSiteOrigin,
  GITHUB_TOKEN_COOKIE,
  GITHUB_USER_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
} from "@/lib/github/oauth-config";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const origin = getSiteOrigin(request.url);
  const response = NextResponse.redirect(`${origin}/login`);

  const clear = { httpOnly: true, path: "/", maxAge: 0 };

  response.cookies.set(GITHUB_TOKEN_COOKIE, "", clear);
  response.cookies.set(GITHUB_USER_COOKIE, "", clear);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", clear);

  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(GITHUB_USER_COOKIE)?.value;
    if (raw) {
      const user = JSON.parse(raw) as { user_id?: string; login?: string };
      if (user.user_id) {
        await deleteGitHubTokenByUserId(user.user_id);
      } else if (user.login) {
        await deleteGitHubTokenByLogin(user.login);
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }

  return response;
}
