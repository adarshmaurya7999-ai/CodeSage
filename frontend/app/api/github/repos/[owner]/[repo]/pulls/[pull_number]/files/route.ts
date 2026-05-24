import { NextResponse } from "next/server";
import { GitHubApiError, githubFetch } from "@/lib/github/api";
import { mapPrFile, mapPullRequest, normalizeFileStatus } from "@/lib/github/mapGithub";
import { parsePatchToDiffLines } from "@/lib/github/parsePatch";
import { requireGitHubAccessToken } from "@/lib/github/session";
import type { LoadedPR, PRFile } from "@/lib/github/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ owner: string; repo: string; pull_number: string }>;
}

interface GithubFileItem {
  filename: string;
  status: string;
  patch?: string;
  additions: number;
  deletions: number;
}

interface GithubContentResponse {
  content?: string;
  encoding?: string;
}

interface GithubPullDetail {
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

async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  try {
    const data = await githubFetch<GithubContentResponse>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`,
      token,
    );
    if (data.content && data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { owner, repo, pull_number } = await context.params;
    const pullNumber = Number.parseInt(pull_number, 10);
    if (Number.isNaN(pullNumber)) {
      return NextResponse.json({ error: "Invalid pull request number" }, { status: 400 });
    }

    const token = await requireGitHubAccessToken();

    const pullRaw = await githubFetch<GithubPullDetail>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
      token,
    );
    const pull = mapPullRequest(pullRaw);
    const headSha = pull.head.sha;

    const rawFiles = await githubFetch<GithubFileItem[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/files?per_page=100`,
      token,
    );

    const files: PRFile[] = await Promise.all(
      rawFiles.map(async (raw) => {
        const patch = raw.patch ?? null;
        let diffLines = patch ? parsePatchToDiffLines(patch) : [];
        let content: string | null = null;

        if (patch) {
          return mapPrFile(raw, diffLines);
        }

        const status = normalizeFileStatus(raw.status);
        if (status !== "removed") {
          content = await fetchFileContent(token, owner, repo, raw.filename, headSha);
          if (content) {
            diffLines = content.split("\n").map((line, index) => ({
              oldNum: null,
              newNum: index + 1,
              content: line,
              type: "add" as const,
            }));
          }
        }

        return mapPrFile({ ...raw, patch: patch ?? undefined }, diffLines);
      }),
    );

    const payload: LoadedPR = { owner, repo, pull, files };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load PR files";
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status: status === 401 || status === 403 || status === 404 ? status : 500 });
  }
}
