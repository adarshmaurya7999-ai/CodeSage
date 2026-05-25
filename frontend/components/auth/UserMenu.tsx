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

export function UserMenu() {
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
    <div className="flex items-center gap-2.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-7 w-7 rounded-full border border-[var(--border)] object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] font-semibold text-[var(--accent-cyan)]">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="max-w-[120px] truncate text-[12px] text-[var(--text-secondary)]">
        {displayName}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] disabled:opacity-50"
      >
        {signingOut ? "…" : "Sign out"}
      </button>
    </div>
  );
}
