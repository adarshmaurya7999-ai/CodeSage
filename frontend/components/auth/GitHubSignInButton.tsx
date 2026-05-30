"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type GitHubSignInButtonProps = {
  variant?: "default" | "command-center";
};

export function GitHubSignInButton({ variant = "default" }: GitHubSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleSignIn() {
    setLoading(true);
    window.location.assign("/api/auth/github");
  }

  if (variant === "command-center") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="login-github-btn"
        aria-busy={loading}
      >
        <span className="login-github-btn__shine" aria-hidden />
        <GitHubIcon className="login-github-btn__icon h-5 w-5" />
        <span className="login-github-btn__text">
          {loading ? "Establishing secure link…" : "Continue with GitHub"}
        </span>
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        variant="secondary"
        size="lg"
        block
        loading={loading}
        loadingLabel="Redirecting to GitHub…"
        onClick={handleSignIn}
        leftIcon={<GitHubIcon className="h-5 w-5" />}
        className="!border-[var(--border-bright)] hover:!border-[var(--accent-cyan)]"
      >
        Continue with GitHub
      </Button>
      <p className="text-center text-[10px] leading-relaxed text-[var(--text-muted)]">
        Uses your CodeSage Local GitHub OAuth app. Callback:{" "}
        <code className="text-[var(--accent)]">/api/auth/github/callback</code>
      </p>
    </div>
  );
}
