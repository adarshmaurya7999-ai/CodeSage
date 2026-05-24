import type { GitHubOwner, PRFile, PRFileStatus, PullRequest, Repository } from "./types";

interface GithubRepoRaw {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  private: boolean;
  updated_at: string;
  description: string | null;
  html_url: string;
}

interface GithubPullRaw {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: GitHubOwner;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

interface GithubFileRaw {
  filename: string;
  status: string;
  patch?: string;
  additions: number;
  deletions: number;
}

export function mapRepository(raw: GithubRepoRaw): Repository {
  return {
    id: raw.id,
    name: raw.name,
    full_name: raw.full_name,
    owner: raw.owner,
    private: raw.private,
    updated_at: raw.updated_at,
    description: raw.description,
    html_url: raw.html_url,
  };
}

export function mapPullRequest(raw: GithubPullRaw): PullRequest {
  return {
    number: raw.number,
    title: raw.title,
    state: raw.state,
    html_url: raw.html_url,
    user: raw.user,
    head: raw.head,
    base: raw.base,
    created_at: raw.created_at,
    changed_files: raw.changed_files ?? 0,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
  };
}

export function normalizeFileStatus(status: string): PRFileStatus {
  if (status === "added" || status === "modified" || status === "removed" || status === "renamed") {
    return status;
  }
  return "modified";
}

export function mapPrFile(raw: GithubFileRaw, diffLines: PRFile["diffLines"]): PRFile {
  return {
    filename: raw.filename,
    status: normalizeFileStatus(raw.status),
    patch: raw.patch ?? null,
    additions: raw.additions,
    deletions: raw.deletions,
    content: null,
    diffLines,
  };
}
