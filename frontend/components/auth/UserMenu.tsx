"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface GitHubAuthUser {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [githubUser, setGithubUser] = useState<GitHubAuthUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user?: GitHubAuthUser | null }) => setGithubUser(data.user ?? null))
      .catch(() => setGithubUser(null));

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    window.location.href = "/api/auth/signout";
  }

  const avatarUrl =
    githubUser?.avatar_url ??
    (supabaseUser?.user_metadata?.avatar_url as string | undefined);
  const displayName =
    githubUser?.login ??
    (supabaseUser?.user_metadata?.user_name as string | undefined) ??
    (supabaseUser?.user_metadata?.full_name as string | undefined) ??
    supabaseUser?.email ??
    null;

  if (!displayName) return null;

  return (
    <div className={`top-bar__user ${compact ? "top-bar__user--compact" : ""}`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="top-bar__user-avatar" />
      ) : (
        <span className="top-bar__user-avatar top-bar__user-avatar--fallback">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
      {!compact && (
        <span className="max-w-[120px] truncate text-[12px] text-[var(--text-secondary)]">
          {displayName}
        </span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="top-bar__sign-out"
        title={compact ? displayName : undefined}
      >
        {signingOut ? "…" : "Sign out"}
      </button>
    </div>
  );
}
