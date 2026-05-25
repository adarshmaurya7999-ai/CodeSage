import { GitHubApiError, githubFetch } from "./api";
import { mapPullRequest } from "./mapGithub";
import type { PullRequest } from "./types";

interface GithubPullRaw {
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
  draft?: boolean;
}

interface GithubIssueRaw {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  } | null;
}

interface GithubSearchItem {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
  pull_request?: { url: string; html_url?: string; merged_at?: string | null };
}

interface GithubSearchResponse {
  total_count: number;
  items: GithubSearchItem[];
}

interface GithubRepoMeta {
  open_issues_count: number;
  has_issues: boolean;
  default_branch: string;
  private: boolean;
}

interface GraphQLResponse {
  data?: {
    repository?: {
      pullRequests?: {
        nodes: Array<{
          number: number;
          title: string;
          state: string;
          url: string;
          createdAt: string;
          isDraft: boolean;
          author: { login: string; avatarUrl: string } | null;
          headRefName: string;
          headRefOid: string;
          baseRefName: string;
          baseRefOid: string;
        }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export type PullFetchSource = "rest" | "issues" | "search" | "graphql" | "rest-all";

export interface FetchPullsResult {
  pulls: PullRequest[];
  usedFallback: boolean;
  source?: PullFetchSource;
  debug?: {
    restOpen: number;
    restAll: number;
    issuesOpen: number;
    searchOpen: number;
    graphqlOpen: number;
    repoOpenIssues: number;
    oauthScopes: string;
    lastError?: string;
  };
}

function repoPath(owner: string, repo: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

function pullNumberFromIssue(issue: GithubIssueRaw | GithubSearchItem): number {
  const url = issue.pull_request?.url;
  if (url) {
    const match = url.match(/\/pulls\/(\d+)(?:\/)?$/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  return issue.number;
}

function mapIssueAsPullRequest(issue: GithubIssueRaw | GithubSearchItem): PullRequest {
  const login = issue.user?.login ?? "unknown";
  const avatar = issue.user?.avatar_url ?? "";
  return {
    number: pullNumberFromIssue(issue),
    title: issue.title,
    state: issue.state,
    html_url: issue.pull_request?.html_url ?? issue.html_url,
    user: { login, avatar_url: avatar },
    head: { ref: "", sha: "" },
    base: { ref: "", sha: "" },
    created_at: issue.created_at,
    changed_files: 0,
    additions: 0,
    deletions: 0,
  };
}

function isOpenPullIssue(issue: GithubIssueRaw): boolean {
  if (!issue.pull_request) {
    return false;
  }
  if (issue.state !== "open") {
    return false;
  }
  const mergedAt = issue.pull_request.merged_at;
  return mergedAt == null || mergedAt === "";
}

async function getRepoMeta(
  owner: string,
  repo: string,
  token: string,
): Promise<GithubRepoMeta | null> {
  try {
    return await githubFetch<GithubRepoMeta>(
      `${repoPath(owner, repo)}?per_page=1`,
      token,
    );
  } catch {
    return null;
  }
}

async function listPullsFromRest(
  owner: string,
  repo: string,
  token: string,
  state: "open" | "closed" | "all",
): Promise<GithubPullRaw[]> {
  return githubFetch<GithubPullRaw[]>(
    `${repoPath(owner, repo)}/pulls?state=${state}&per_page=100&sort=updated&direction=desc`,
    token,
  );
}

async function listOpenPullIssues(
  owner: string,
  repo: string,
  token: string,
): Promise<GithubIssueRaw[]> {
  const collected: GithubIssueRaw[] = [];

  for (let page = 1; page <= 3; page += 1) {
    const batch = await githubFetch<GithubIssueRaw[]>(
      `${repoPath(owner, repo)}/issues?state=open&per_page=100&page=${page}&sort=updated&direction=desc`,
      token,
    );
    collected.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }

  return collected.filter(isOpenPullIssue);
}

async function searchOpenPullItems(
  owner: string,
  repo: string,
  token: string,
): Promise<GithubSearchItem[]> {
  const q = `is:pr is:open repo:${owner}/${repo}`;
  const data = await githubFetch<GithubSearchResponse>(
    `/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=50`,
    token,
  );
  return data.items.filter((item) => item.pull_request != null);
}

async function listPullsFromGraphQL(
  owner: string,
  repo: string,
  token: string,
): Promise<PullRequest[]> {
  const query = `
    query ($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        pullRequests(
          states: OPEN
          first: 50
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          nodes {
            number
            title
            state
            url
            createdAt
            isDraft
            author { login avatarUrl }
            headRefName
            headRefOid
            baseRefName
            baseRefOid
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { owner, name: repo },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GitHubApiError(
      `GraphQL request failed (${response.status})`,
      response.status,
    );
  }

  const body = (await response.json()) as GraphQLResponse;
  if (body.errors?.length) {
    throw new GitHubApiError(body.errors.map((e) => e.message).join("; "), 422);
  }

  const nodes = body.data?.repository?.pullRequests?.nodes ?? [];
  return nodes.map((node) => ({
    number: node.number,
    title: node.title,
    state: node.state.toLowerCase(),
    html_url: node.url,
    user: {
      login: node.author?.login ?? "unknown",
      avatar_url: node.author?.avatarUrl ?? "",
    },
    head: { ref: node.headRefName, sha: node.headRefOid },
    base: { ref: node.baseRefName, sha: node.baseRefOid },
    created_at: node.createdAt,
    changed_files: 0,
    additions: 0,
    deletions: 0,
  }));
}

async function hydratePull(
  owner: string,
  repo: string,
  number: number,
  token: string,
): Promise<PullRequest | null> {
  try {
    const raw = await githubFetch<GithubPullRaw>(
      `${repoPath(owner, repo)}/pulls/${number}`,
      token,
    );
    return mapPullRequest(raw);
  } catch {
    return null;
  }
}

async function hydrateMany(
  owner: string,
  repo: string,
  numbers: number[],
  token: string,
): Promise<PullRequest[]> {
  const unique = [...new Set(numbers)].slice(0, 50);
  const results: PullRequest[] = [];
  const batchSize = 6;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const chunk = await Promise.all(
      batch.map((n) => hydratePull(owner, repo, n, token)),
    );
    for (const pr of chunk) {
      if (pr) {
        results.push(pr);
      }
    }
  }

  return results;
}

async function pullsFromIssues(
  owner: string,
  repo: string,
  token: string,
): Promise<PullRequest[]> {
  const issues = await listOpenPullIssues(owner, repo, token);
  if (issues.length === 0) {
    return [];
  }

  const numbers = issues.map(pullNumberFromIssue);
  const hydrated = await hydrateMany(owner, repo, numbers, token);
  if (hydrated.length > 0) {
    return hydrated;
  }

  return issues.map(mapIssueAsPullRequest);
}

async function pullsFromSearch(
  owner: string,
  repo: string,
  token: string,
): Promise<PullRequest[]> {
  const items = await searchOpenPullItems(owner, repo, token);
  if (items.length === 0) {
    return [];
  }

  const numbers = items.map(pullNumberFromIssue);
  const hydrated = await hydrateMany(owner, repo, numbers, token);
  if (hydrated.length > 0) {
    return hydrated;
  }

  return items.map(mapIssueAsPullRequest);
}

function sortPullsByDate(pulls: PullRequest[]): PullRequest[] {
  return [...pulls].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function readOAuthScopes(token: string): Promise<string> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    return res.headers.get("x-oauth-scopes")?.trim() || "(unknown)";
  } catch {
    return "(unknown)";
  }
}

/**
 * Fetches open pull requests via REST, issues, search, and GraphQL fallbacks.
 */
export async function fetchOpenPullRequests(
  owner: string,
  repo: string,
  token: string,
): Promise<FetchPullsResult> {
  const ownerLogin = owner.trim();
  const repoName = repo.trim();
  const oauthScopes = await readOAuthScopes(token);
  const repoMeta = await getRepoMeta(ownerLogin, repoName, token);

  const debug: NonNullable<FetchPullsResult["debug"]> = {
    restOpen: 0,
    restAll: 0,
    issuesOpen: 0,
    searchOpen: 0,
    graphqlOpen: 0,
    repoOpenIssues: repoMeta?.open_issues_count ?? -1,
    oauthScopes,
  };

  let lastError: string | undefined;

  const finish = (
    pulls: PullRequest[],
    source: PullFetchSource,
    usedFallback: boolean,
  ): FetchPullsResult => ({
    pulls: sortPullsByDate(pulls),
    usedFallback,
    source,
    debug: { ...debug, lastError },
  });

  try {
    const restOpen = await listPullsFromRest(ownerLogin, repoName, token, "open");
    debug.restOpen = restOpen.length;
    if (restOpen.length > 0) {
      return finish(restOpen.map(mapPullRequest), "rest", false);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "REST pulls failed";
    if (error instanceof GitHubApiError && (error.status === 401 || error.status === 403)) {
      throw error;
    }
  }

  try {
    const fromGraphql = await listPullsFromGraphQL(ownerLogin, repoName, token);
    debug.graphqlOpen = fromGraphql.length;
    if (fromGraphql.length > 0) {
      return finish(fromGraphql, "graphql", true);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "GraphQL failed";
    if (error instanceof GitHubApiError && (error.status === 401 || error.status === 403)) {
      throw error;
    }
  }

  try {
    const fromIssues = await pullsFromIssues(ownerLogin, repoName, token);
    debug.issuesOpen = fromIssues.length;
    if (fromIssues.length > 0) {
      return finish(fromIssues, "issues", true);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Issues API failed";
    if (error instanceof GitHubApiError && (error.status === 401 || error.status === 403)) {
      throw error;
    }
  }

  try {
    const fromSearch = await pullsFromSearch(ownerLogin, repoName, token);
    debug.searchOpen = fromSearch.length;
    if (fromSearch.length > 0) {
      return finish(fromSearch, "search", true);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Search API failed";
  }

  try {
    const restAll = await listPullsFromRest(ownerLogin, repoName, token, "all");
    debug.restAll = restAll.length;
    const openFromAll = restAll.filter((p) => p.state === "open");
    debug.restOpen = openFromAll.length;
    if (openFromAll.length > 0) {
      return finish(openFromAll.map(mapPullRequest), "rest-all", true);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "REST pulls (all) failed";
  }

  if (debug.restAll > 0) {
    lastError = `This repository has ${debug.restAll} pull request(s) on GitHub, but none are open.`;
  } else if (debug.repoOpenIssues === 0) {
    lastError =
      "GitHub reports this repository has no pull requests yet. Open a PR on GitHub (Pull requests → New pull request), then refresh here.";
  }

  return {
    pulls: [],
    usedFallback: false,
    debug: { ...debug, lastError },
  };
}
