import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * GITHUB_PRIVATE_KEY is stored base64-encoded in .env — decode to PEM for Octokit.
 */
export function getGitHubPrivateKey(): string {
  const raw = requireEnv("GITHUB_PRIVATE_KEY");
  const decoded = Buffer.from(raw, "base64").toString("utf-8");

  if (decoded.includes("BEGIN")) {
    return decoded;
  }

  // DER-only base64: wrap as PEM for createAppAuth
  const pemBody = raw.match(/.{1,64}/g)?.join("\n") ?? raw;
  return `-----BEGIN RSA PRIVATE KEY-----\n${pemBody}\n-----END RSA PRIVATE KEY-----`;
}

/** Octokit client authenticated as a GitHub App installation. */
export function createInstallationOctokit(installationId: number): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: requireEnv("GITHUB_APP_ID"),
      privateKey: getGitHubPrivateKey(),
      installationId,
    },
  });
}
