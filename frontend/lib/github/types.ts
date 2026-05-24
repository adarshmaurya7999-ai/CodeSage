import type { DiffLine, Finding, Severity } from "@/lib/mock-data";

export interface GitHubOwner {
  login: string;
  avatar_url: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  private: boolean;
  updated_at: string;
  description: string | null;
  html_url: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: GitHubOwner;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  changed_files: number;
  additions: number;
  deletions: number;
}

export type PRFileStatus = "added" | "modified" | "removed" | "renamed";

export interface PRFile {
  filename: string;
  status: PRFileStatus;
  patch: string | null;
  additions: number;
  deletions: number;
  content: string | null;
  diffLines: DiffLine[];
}

export interface LoadedPR {
  owner: string;
  repo: string;
  pull: PullRequest;
  files: PRFile[];
}

export interface PRViewState {
  repository: string;
  branch: string;
  number: number;
  title: string;
  status: "open" | "closed";
  author: string;
  created: string;
  dangerScore: number;
  riskLabel: string;
  filePath: string;
  diffStats: { additions: number; deletions: number };
}

export interface AnalysisResult {
  findings: Finding[];
  dangerScore: number;
  riskLabel: string;
  summary: string;
}

export type { DiffLine, Finding, Severity };
