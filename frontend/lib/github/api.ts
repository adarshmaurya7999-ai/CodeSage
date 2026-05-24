const GITHUB_API = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimitRemaining?: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export async function githubFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const remaining = response.headers.get("x-ratelimit-remaining");
  const rateLimitRemaining = remaining != null ? Number(remaining) : undefined;

  if (response.status === 401) {
    throw new GitHubApiError(
      "GitHub authorization failed. Sign out and sign in again.",
      401,
      rateLimitRemaining,
    );
  }

  if (response.status === 403) {
    const isRateLimit = rateLimitRemaining === 0;
    throw new GitHubApiError(
      isRateLimit
        ? "GitHub API rate limit exceeded. Try again in a few minutes."
        : "Access denied to this repository. Check permissions or install the app on the repo.",
      403,
      rateLimitRemaining,
    );
  }

  if (response.status === 404) {
    throw new GitHubApiError("Resource not found on GitHub.", 404, rateLimitRemaining);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ? `: ${body.message}` : "";
    } catch {
      /* ignore */
    }
    throw new GitHubApiError(
      `GitHub API error (${response.status})${detail}`,
      response.status,
      rateLimitRemaining,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
