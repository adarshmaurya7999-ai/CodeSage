import { NextResponse } from "next/server";
import { GitHubApiError, githubFetch } from "@/lib/github/api";
import { requireGitHubSession } from "@/lib/github/session";
import type { PRCommit } from "@/lib/review/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ owner: string; repo: string; pull_number: string }>;
}

interface GithubCommitItem {
  sha: string;
  commit: {
    message: string;
    author: { name: string | null; date: string };
  };
  author: { login: string | null } | null;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { owner, repo, pull_number } = await context.params;
    const pullNumber = Number.parseInt(pull_number, 10);
    if (Number.isNaN(pullNumber)) {
      return NextResponse.json({ error: "Invalid pull number" }, { status: 400 });
    }

    const { token } = await requireGitHubSession();
    const ownerLogin = decodeURIComponent(owner);
    const repoName = decodeURIComponent(repo);

    const raw = await githubFetch<GithubCommitItem[]>(
      `/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}/pulls/${pullNumber}/commits?per_page=30`,
      token,
    );

    const commits: PRCommit[] = raw.map((item) => {
      const firstLine = item.commit.message.split("\n")[0] ?? item.commit.message;
      return {
        sha: item.sha.slice(0, 7),
        message: firstLine,
        author: item.author?.login ?? item.commit.author.name ?? "unknown",
        date: new Date(item.commit.author.date).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };
    });

    return NextResponse.json({ commits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load commits";
    const status = error instanceof GitHubApiError ? error.status : 500;
    const httpStatus =
      message.includes("Not signed in") || message.includes("not found in database")
        ? 401
        : status === 401 || status === 403 || status === 404
          ? status
          : 500;
    return NextResponse.json({ error: message, commits: [] }, { status: httpStatus });
  }
}
