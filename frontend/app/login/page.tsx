import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { JarvisBackground } from "@/components/codeguard/JarvisBackground";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authFailed = params.error === "auth";
  const failReason = params.reason ? decodeURIComponent(params.reason) : null;

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
            <div
              className="mb-4 rounded-md border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] px-3 py-2 text-center text-[12px] text-[var(--danger)]"
              role="alert"
            >
              <p>Sign-in failed. Please try again.</p>
              {failReason && (
                <p className="mt-1 break-words text-[11px] opacity-90">{failReason}</p>
              )}
            </div>
          )}

          <GitHubSignInButton />

          <details className="mt-6 text-[11px] leading-relaxed text-[var(--text-muted)]">
            <summary className="cursor-pointer text-center text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]">
              GitHub OAuth setup (CodeSage Local)
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-left">
              <li>
                Create a <strong>GitHub OAuth App</strong> at{" "}
                <a
                  href="https://github.com/settings/applications/new"
                  className="text-[var(--accent)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub Developer Settings
                </a>
                .
              </li>
              <li>
                <strong>Authorization callback URL</strong> (must match exactly):
                <code className="mt-1 block break-all rounded bg-[var(--bg-elevated)] px-2 py-1 text-[10px] text-[var(--accent)]">
                  http://localhost:3000/api/auth/github/callback
                </code>
              </li>
              <li>
                Put Client ID + Secret in <code>frontend/.env.local</code> as{" "}
                <code>GITHUB_OAUTH_CLIENT_ID</code> and <code>GITHUB_OAUTH_CLIENT_SECRET</code>.
              </li>
              <li>Uncheck <strong>Enable Device Flow</strong> on the OAuth app (web login only).</li>
              <li>Restart <code>npm run dev</code>, then sign in again.</li>
            </ol>
            <p className="mt-3 text-[10px] text-[var(--critical)]">
              Do not mix Supabase callback URL on this OAuth app — that URL belongs only on the
              separate app configured in Supabase Dashboard.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
