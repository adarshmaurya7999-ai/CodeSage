import { NextResponse } from "next/server";
import { GitHubApiError, githubFetch } from "@/lib/github/api";
import { mapPullRequest } from "@/lib/github/mapGithub";
import { requireGitHubAccessToken } from "@/lib/github/session";
import type { PullRequest } from "@/lib/github/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ owner: string; repo: string }>;
}

interface GithubPullListItem {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string; avatar_url: string };
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { owner, repo } = await context.params;
    const token = await requireGitHubAccessToken();
    const raw = await githubFetch<GithubPullListItem[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=30`,
      token,
    );
    const pulls: PullRequest[] = raw.map(mapPullRequest);
    return NextResponse.json({ pulls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pull requests";
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status: status === 401 || status === 403 || status === 404 ? status : 500 });
  }
}
