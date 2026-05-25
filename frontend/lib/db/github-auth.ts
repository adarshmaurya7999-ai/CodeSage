import { GITHUB_OAUTH_SCOPES } from "@/lib/github/oauth-config";
import { getSupabaseAdmin } from "./supabase-admin";

export interface GitHubAuthProfile {
  githubId: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface StoredGitHubAuth {
  userId: string;
  githubId: number;
  login: string;
}

/**
 * Upserts the GitHub user profile and stores the OAuth access token after login.
 */
export async function saveGitHubAuthToDatabase(
  profile: GitHubAuthProfile,
  accessToken: string,
): Promise<StoredGitHubAuth | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn(
      "[github-auth] SUPABASE_SERVICE_KEY not set — skipping DB token storage. Add it to frontend/.env.local",
    );
    return null;
  }

  const now = new Date().toISOString();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        github_id: profile.githubId,
        github_login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        email: profile.email,
        updated_at: now,
      },
      { onConflict: "github_id" },
    )
    .select("id, github_id, github_login")
    .single();

  if (userError || !userRow) {
    console.error("[github-auth] Failed to upsert user:", userError?.message);
    return null;
  }

  const { error: tokenError } = await supabase.from("github_tokens").upsert(
    {
      user_id: userRow.id,
      access_token: accessToken,
      scopes: GITHUB_OAUTH_SCOPES,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (tokenError) {
    console.error("[github-auth] Failed to upsert token:", tokenError.message);
    return null;
  }

  return {
    userId: userRow.id,
    githubId: userRow.github_id,
    login: userRow.github_login,
  };
}

async function getTokenForUserId(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from("github_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (tokenError || !tokenRow?.access_token) {
    return null;
  }

  return tokenRow.access_token;
}

export async function getGitHubTokenByUserId(userId: string): Promise<string | null> {
  if (!userId.trim()) {
    return null;
  }
  return getTokenForUserId(userId.trim());
}

export async function getGitHubTokenByLogin(login: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("github_login", login)
    .maybeSingle();

  if (userError || !userRow) {
    return null;
  }

  return getTokenForUserId(userRow.id);
}

export async function deleteGitHubTokenByUserId(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId.trim()) {
    return;
  }

  await supabase.from("github_tokens").delete().eq("user_id", userId.trim());
}

export async function deleteGitHubTokenByLogin(login: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("github_login", login)
    .maybeSingle();

  if (!userRow?.id) {
    return;
  }

  await deleteGitHubTokenByUserId(userRow.id);
}
