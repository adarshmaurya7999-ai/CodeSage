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
              GitHub login setup (fix 404)
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-left">
              <li>
                Create a <strong>GitHub OAuth App</strong> (not your GitHub App for webhooks):{" "}
                <a
                  href="https://github.com/settings/developers"
                  className="text-[var(--accent-cyan)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Developer settings → OAuth Apps
                </a>
                .
              </li>
              <li>
                Set <strong>Authorization callback URL</strong> to your Supabase callback (copy
                from Supabase → Authentication → Providers → GitHub):
                <code className="mt-1 block break-all rounded bg-[var(--bg-elevated)] px-2 py-1 text-[10px] text-[var(--accent-cyan-dim)]">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback
                </code>
              </li>
              <li>
                Copy the OAuth app&apos;s <strong>Client ID</strong> (looks like{" "}
                <code className="text-[var(--text-secondary)]">Ov23li…</code>) —{" "}
                <em>not</em> the app name &quot;CodeSage&quot;.
              </li>
              <li>
                In{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/auth/providers"
                  className="text-[var(--accent-cyan)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase → Authentication → Providers → GitHub
                </a>
                , paste Client ID + Client Secret and enable GitHub.
              </li>
              <li>
                Under <strong>URL Configuration</strong>, set Site URL to{" "}
                <code className="text-[var(--text-secondary)]">http://localhost:3000</code> and add
                only this redirect URL (do not add the Supabase{" "}
                <code className="text-[var(--text-secondary)]">/auth/v1/callback</code> here — that
                belongs on the GitHub OAuth app only):{" "}
                <code className="text-[var(--text-secondary)]">http://localhost:3000/auth/callback</code>
              </li>
            </ol>
            <p className="mt-3 text-[10px] text-[var(--danger)]">
              If GitHub shows 404, Supabase has the wrong Client ID (e.g. the app name instead of the
              OAuth Client ID from GitHub).
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
