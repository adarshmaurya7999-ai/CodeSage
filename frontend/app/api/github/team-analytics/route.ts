import { NextResponse } from "next/server";
import { GitHubApiError } from "@/lib/github/api";
import { fetchTeamAnalytics } from "@/lib/github/teamAnalytics";
import { requireGitHubSession } from "@/lib/github/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { token } = await requireGitHubSession();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    const data = await fetchTeamAnalytics(token, since, until);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load team analytics";
    const status = error instanceof GitHubApiError ? error.status : 500;
    const httpStatus =
      message.includes("Not signed in") || message.includes("not found in database")
        ? 401
        : status === 401 || status === 403
          ? status
          : 500;
    return NextResponse.json({ error: message }, { status: httpStatus });
  }
}
