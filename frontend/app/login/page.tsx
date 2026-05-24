import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { JarvisBackground } from "@/components/codeguard/JarvisBackground";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authFailed = params.error === "auth";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <JarvisBackground />

      <div className="relative z-10 w-full max-w-[400px] px-6">
        <div className="panel-card p-8 shadow-[var(--glow-cyan)]">
          <div className="mb-8 text-center">
            <p className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.25em] text-[var(--accent-cyan)]">
              CodeSage AI
            </p>
            <h1 className="mt-3 text-[22px] font-semibold text-[var(--text-primary)]">
              Team dashboard
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Sign in with GitHub to review pull requests and AI findings with your team.
            </p>
          </div>

          {authFailed && (
            <p
              className="mb-4 rounded-md border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3 py-2 text-center text-[12px] text-[var(--danger)]"
              role="alert"
            >
              Sign-in failed. Please try again.
            </p>
          )}

          <GitHubSignInButton />

          <p className="mt-6 text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
            GitHub OAuth is handled securely via Supabase. Enable the GitHub provider in your
            Supabase project and add this callback URL:{" "}
            <code className="text-[var(--accent-cyan-dim)]">/auth/callback</code>
          </p>
        </div>
      </div>
    </div>
  );
}
