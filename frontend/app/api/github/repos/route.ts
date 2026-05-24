import { NextResponse } from "next/server";
import { GitHubApiError, githubFetch } from "@/lib/github/api";
import { mapRepository } from "@/lib/github/mapGithub";
import { requireGitHubAccessToken } from "@/lib/github/session";
import type { Repository } from "@/lib/github/types";

export const runtime = "nodejs";

interface GithubRepoListItem {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  updated_at: string;
  description: string | null;
  html_url: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const token = await requireGitHubAccessToken();
    const raw = await githubFetch<GithubRepoListItem[]>(
      "/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator,organization_member",
      token,
    );
    const repos: Repository[] = raw.map(mapRepository);
    return NextResponse.json({ repos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load repositories";
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status: status === 401 || status === 403 ? status : 500 });
  }
}
