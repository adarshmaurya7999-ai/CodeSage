import { createClient } from "@/lib/supabase/server";

/**
 * Reads the GitHub OAuth token from the Supabase session.
 * Requires "Store provider tokens" enabled in Supabase Auth + repo scope on sign-in.
 */
export async function getGitHubAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.provider_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function requireGitHubAccessToken(): Promise<string> {
  const token = await getGitHubAccessToken();
  if (!token) {
    throw new Error(
      "GitHub token not available. Sign out and sign in again, and ensure Supabase stores provider tokens with repo scope.",
    );
  }
  return token;
}
