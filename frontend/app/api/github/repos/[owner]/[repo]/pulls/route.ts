import { NextResponse } from "next/server";
import { GitHubApiError } from "@/lib/github/api";
import { fetchOpenPullRequests } from "@/lib/github/fetchPulls";
import { requireGitHubSession } from "@/lib/github/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ owner: string; repo: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { owner, repo } = await context.params;
    const { token } = await requireGitHubSession();

    const result = await fetchOpenPullRequests(
      decodeURIComponent(owner),
      decodeURIComponent(repo),
      token,
    );

    return NextResponse.json({
      pulls: result.pulls,
      meta: {
        count: result.pulls.length,
        usedFallback: result.usedFallback,
        source: result.source,
        owner: decodeURIComponent(owner),
        repo: decodeURIComponent(repo),
        debug: result.debug,
        hint:
          result.pulls.length === 0 && result.debug?.restAll === 0
            ? "no_prs_on_github"
            : undefined,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pull requests";
    const status = error instanceof GitHubApiError ? error.status : 500;
    const httpStatus =
      message.includes("Not signed in") || message.includes("not found in database")
        ? 401
        : status === 401 || status === 403 || status === 404
          ? status
          : 500;
    return NextResponse.json({ error: message, pulls: [] }, { status: httpStatus });
  }
}
