import { GitHubApiError, githubFetch } from "./api";
import { mapRepository } from "./mapGithub";
import type { Repository } from "./types";

const MAX_REPOS = 15;
const MAX_PRS_PER_REPO = 40;
const MAX_DETAIL_ENRICH = 60;
const DETAIL_CONCURRENCY = 8;
const MAX_DEVELOPER_CARDS = 24;
const MAX_USER_PROFILE_FETCH = 50;
const USER_PROFILE_CONCURRENCY = 8;

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

interface GithubPullListItem {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: { login: string; avatar_url: string } | null;
  additions?: number | null;
  deletions?: number | null;
  changed_files?: number | null;
  commits?: number | null;
}

export interface TeamAnalyticsPRRow {
  id: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  developer: string;
  developerAvatar: string;
  riskScore: number;
  critical: number;
  high: number;
  medium: number;
  fixesAccepted: number;
  timeToResolveHours: number | null;
  htmlUrl: string;
  createdAt: string;
}

export interface TeamDeveloperCard {
  login: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  prsPerMonth: number;
  avgRisk: number;
  recurringPattern: string;
  githubContributions?: number;
}

interface GithubContributorRaw {
  login: string | null;
  id: number;
  avatar_url: string;
  contributions: number;
  type?: string;
}

interface GithubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface ContributorMeta {
  login: string;
  avatarUrl: string;
  githubContributions: number;
}

interface GithubCommitListItem {
  sha: string;
  author: { login: string | null; id?: number; avatar_url: string } | null;
  commit: {
    author: { name: string; email: string; date: string };
  };
}

/** GitHub list endpoints must return arrays; guard against objects/undefined. */
function asGithubArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  return [];
}

function contributorLogin(c: GithubContributorRaw): string | null {
  if (c.login) return c.login;
  return null;
}

export interface TeamAnalyticsPayload {
  developers: TeamDeveloperCard[];
  pullRequests: TeamAnalyticsPRRow[];
  dateRange: { since: string; until: string };
  reposScanned: number;
  meta: {
    totalPrs: number;
    totalContributors: number;
    developersShown: number;
    note: string;
  };
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "chore",
  "fix",
  "update",
  "add",
  "remove",
  "merge",
  "pull",
  "request",
]);

export function defaultDateRange(): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - 48);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

export function parseDateRange(
  sinceParam: string | null,
  untilParam: string | null,
): { since: Date; until: Date; sinceStr: string; untilStr: string } {
  const defaults = defaultDateRange();
  const sinceStr = sinceParam && /^\d{4}-\d{2}-\d{2}$/.test(sinceParam) ? sinceParam : defaults.since;
  const untilStr = untilParam && /^\d{4}-\d{2}-\d{2}$/.test(untilParam) ? untilParam : defaults.until;
  const since = new Date(`${sinceStr}T00:00:00.000Z`);
  const until = new Date(`${untilStr}T23:59:59.999Z`);
  if (since > until) {
    return { since: until, until: since, sinceStr: untilStr, untilStr: sinceStr };
  }
  return { since, until, sinceStr, untilStr };
}

function monthsInRange(since: Date, until: Date): number {
  const ms = Math.max(until.getTime() - since.getTime(), 24 * 60 * 60 * 1000);
  return Math.max(ms / (30 * 24 * 60 * 60 * 1000), 1 / 30);
}

export function computeRiskScore(
  additions: number,
  deletions: number,
  changedFiles: number,
): number {
  const churn = additions + deletions;
  const raw = (churn / 600) * 4 + (changedFiles / 12) * 2.5;
  return Math.min(10, Math.round(raw * 10) / 10);
}

function severityFromMetrics(
  riskScore: number,
  changedFiles: number,
  churn: number,
): { critical: number; high: number; medium: number } {
  let critical = 0;
  let high = 0;
  let medium = 0;

  if (riskScore >= 7.5 || changedFiles >= 35 || churn > 4000) {
    critical = Math.min(3, Math.floor(changedFiles / 18) + (riskScore >= 8 ? 1 : 0));
  }
  if (riskScore >= 5 || changedFiles >= 12 || churn > 1200) {
    high = Math.min(5, Math.floor(changedFiles / 10) + (riskScore >= 6 ? 1 : 0));
  }
  medium = Math.min(
    6,
    Math.max(0, Math.floor(changedFiles / 4) + Math.floor(riskScore / 2) - critical - high),
  );

  return { critical, high, medium };
}

function hoursToResolve(createdAt: string, mergedAt: string | null): number | null {
  if (!mergedAt) return null;
  const created = new Date(createdAt).getTime();
  const merged = new Date(mergedAt).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(merged) || merged <= created) {
    return null;
  }
  return Math.round(((merged - created) / (1000 * 60 * 60)) * 10) / 10;
}

function recurringPatternForAuthor(prs: TeamAnalyticsPRRow[]): string {
  const wordFreq = new Map<string, number>();
  const repoFreq = new Map<string, number>();

  for (const pr of prs) {
    repoFreq.set(`${pr.owner}/${pr.repo}`, (repoFreq.get(`${pr.owner}/${pr.repo}`) ?? 0) + 1);
    for (const word of pr.title.toLowerCase().split(/\W+/)) {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
      }
    }
  }

  const topWord = [...wordFreq.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topWord && topWord[1] >= 2) {
    const label = topWord[0].replace(/-/g, " ");
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} in recent PR titles`;
  }

  const topRepo = [...repoFreq.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topRepo && topRepo[1] >= 2) {
    return `Frequent changes in ${topRepo[0]}`;
  }

  const sensitive = prs.filter((p) => p.critical + p.high > 0).length;
  if (sensitive >= 2) {
    return "Large or high-churn pull requests";
  }

  return "Mixed change patterns across repositories";
}

function prInRange(pr: GithubPullListItem, since: Date, until: Date): boolean {
  const updated = new Date(pr.updated_at);
  const created = new Date(pr.created_at);
  return (
    (updated >= since && updated <= until) || (created >= since && created <= until)
  );
}

async function enrichPullDetails(
  owner: string,
  repo: string,
  pulls: GithubPullListItem[],
  token: string,
): Promise<GithubPullListItem[]> {
  const toEnrich = pulls.slice(0, MAX_DETAIL_ENRICH);
  const enriched = new Map<number, GithubPullListItem>();

  for (let i = 0; i < toEnrich.length; i += DETAIL_CONCURRENCY) {
    const batch = toEnrich.slice(i, i + DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (pr) => {
        try {
          const detail = await githubFetch<GithubPullListItem>(
            `/repos/${owner}/${repo}/pulls/${pr.number}`,
            token,
          );
          enriched.set(pr.number, { ...pr, ...detail });
        } catch {
          enriched.set(pr.number, pr);
        }
      }),
    );
  }

  return pulls.map((pr) => enriched.get(pr.number) ?? pr);
}

async function fetchCommitAuthors(
  owner: string,
  repo: string,
  token: string,
): Promise<GithubContributorRaw[]> {
  try {
    const commits = asGithubArray<GithubCommitListItem>(
      await githubFetch<unknown>(
        `/repos/${owner}/${repo}/commits?per_page=50`,
        token,
      ),
    );
    const seen = new Set<string>();
    const authors: GithubContributorRaw[] = [];

    for (const commit of commits) {
      const login = commit.author?.login;
      if (!login || seen.has(login)) continue;
      seen.add(login);
      authors.push({
        login,
        id: commit.author?.id ?? 0,
        avatar_url: commit.author?.avatar_url ?? "",
        contributions: 0,
      });
    }
    return authors;
  } catch {
    return [];
  }
}

async function fetchRepoContributors(
  owner: string,
  repo: string,
  token: string,
): Promise<GithubContributorRaw[]> {
  const merged = new Map<string, GithubContributorRaw>();

  const addList = (list: GithubContributorRaw[]) => {
    for (const c of list) {
      const login = contributorLogin(c);
      if (!login) continue;
      const existing = merged.get(login);
      if (existing) {
        existing.contributions += c.contributions ?? 0;
      } else {
        merged.set(login, {
          login,
          id: c.id,
          avatar_url: c.avatar_url,
          contributions: c.contributions ?? 0,
        });
      }
    }
  };

  try {
    const contributors = asGithubArray<GithubContributorRaw>(
      await githubFetch<unknown>(
        `/repos/${owner}/${repo}/contributors?per_page=100&anon=1`,
        token,
      ),
    );
    addList(contributors);
  } catch (error) {
    if (!(error instanceof GitHubApiError && (error.status === 403 || error.status === 404))) {
      /* try fallbacks below */
    }
  }

  if (merged.size === 0) {
    try {
      const collaborators = asGithubArray<{
        login: string | null;
        id: number;
        avatar_url: string;
      }>(
        await githubFetch<unknown>(
          `/repos/${owner}/${repo}/collaborators?per_page=100`,
          token,
        ),
      );
      addList(
        collaborators
          .filter((c) => c.login)
          .map((c) => ({
            login: c.login!,
            id: c.id,
            avatar_url: c.avatar_url,
            contributions: 0,
          })),
      );
    } catch {
      /* commits fallback */
    }
  }

  const commitAuthors = await fetchCommitAuthors(owner, repo, token);
  addList(commitAuthors);

  return [...merged.values()];
}

async function fetchAllContributors(
  repos: Repository[],
  token: string,
): Promise<Map<string, ContributorMeta>> {
  const merged = new Map<string, ContributorMeta>();

  await Promise.all(
    repos.map(async (r) => {
      const list = asGithubArray<GithubContributorRaw>(
        await fetchRepoContributors(r.owner.login, r.name, token),
      );
      for (const c of list) {
        const login = contributorLogin(c);
        if (!login) continue;
        const existing = merged.get(login);
        if (existing) {
          existing.githubContributions += c.contributions ?? 0;
        } else {
          merged.set(login, {
            login,
            avatarUrl: c.avatar_url,
            githubContributions: c.contributions ?? 0,
          });
        }
      }
    }),
  );

  return merged;
}

async function enrichUserProfiles(
  logins: string[],
  token: string,
): Promise<Map<string, { displayName: string; avatarUrl: string }>> {
  const result = new Map<string, { displayName: string; avatarUrl: string }>();
  const safeLogins = Array.isArray(logins) ? logins : [];
  const toFetch = safeLogins.slice(0, MAX_USER_PROFILE_FETCH);

  for (let i = 0; i < toFetch.length; i += USER_PROFILE_CONCURRENCY) {
    const batch = toFetch.slice(i, i + USER_PROFILE_CONCURRENCY);
    await Promise.all(
      batch.map(async (login) => {
        try {
          const profile = await githubFetch<GithubUserProfile>(`/users/${login}`, token);
          result.set(login, {
            displayName: profile.name?.trim() || login,
            avatarUrl: profile.avatar_url,
          });
        } catch {
          result.set(login, { displayName: login, avatarUrl: "" });
        }
      }),
    );
  }

  for (const login of safeLogins) {
    if (!result.has(login)) {
      result.set(login, { displayName: login, avatarUrl: "" });
    }
  }

  return result;
}

function buildDeveloperCards(
  contributors: Map<string, ContributorMeta>,
  byAuthor: Map<string, TeamAnalyticsPRRow[]>,
  profiles: Map<string, { displayName: string; avatarUrl: string }>,
  monthSpan: number,
): TeamDeveloperCard[] {
  const allLogins = new Set<string>([...contributors.keys(), ...byAuthor.keys()]);

  const cards: TeamDeveloperCard[] = [...allLogins].map((login) => {
    const prs = byAuthor.get(login) ?? [];
    const meta = contributors.get(login);
    const profile = profiles.get(login);
    const hasPrs = prs.length > 0;

    const avgRisk = hasPrs
      ? Math.round((prs.reduce((s, p) => s + p.riskScore, 0) / prs.length) * 10) / 10
      : 0;

    const avatarUrl =
      profile?.avatarUrl || meta?.avatarUrl || prs[0]?.developerAvatar || "";

    return {
      login,
      displayName: profile?.displayName ?? login,
      avatarUrl,
      role: "Contributor",
      prsPerMonth: hasPrs ? Math.round((prs.length / monthSpan) * 10) / 10 : 0,
      avgRisk,
      recurringPattern: hasPrs
        ? recurringPatternForAuthor(prs)
        : "No pull requests in selected date range",
      githubContributions: meta?.githubContributions ?? 0,
    };
  });

  cards.sort((a, b) => {
    if (a.prsPerMonth !== b.prsPerMonth) return b.prsPerMonth - a.prsPerMonth;
    return (b.githubContributions ?? 0) - (a.githubContributions ?? 0);
  });

  return cards;
}

async function fetchRepoPulls(
  owner: string,
  repo: string,
  token: string,
  since: Date,
  until: Date,
): Promise<Array<GithubPullListItem & { owner: string; repo: string }>> {
  try {
    const raw = asGithubArray<GithubPullListItem>(
      await githubFetch<unknown>(
        `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=${MAX_PRS_PER_REPO}`,
        token,
      ),
    );
    const inRange = raw.filter((pr) => prInRange(pr, since, until));
    const detailed = await enrichPullDetails(owner, repo, inRange, token);
    return detailed.map((pr) => ({ ...pr, owner, repo }));
  } catch (error) {
    if (error instanceof GitHubApiError && (error.status === 403 || error.status === 404)) {
      return [];
    }
    throw error;
  }
}

export async function fetchTeamAnalytics(
  token: string,
  sinceParam: string | null,
  untilParam: string | null,
): Promise<TeamAnalyticsPayload> {
  const { since, until, sinceStr, untilStr } = parseDateRange(sinceParam, untilParam);
  const monthSpan = monthsInRange(since, until);

  const rawRepos = asGithubArray<GithubRepoListItem>(
    await githubFetch<unknown>(
      "/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator,organization_member",
      token,
    ),
  );
  const repos: Repository[] = rawRepos.map(mapRepository).slice(0, MAX_REPOS);

  const [pullBatches, contributors] = await Promise.all([
    Promise.all(repos.map((r) => fetchRepoPulls(r.owner.login, r.name, token, since, until))),
    fetchAllContributors(repos, token),
  ]);
  const allPulls = pullBatches.flat();

  const rows: TeamAnalyticsPRRow[] = allPulls
    .filter((pr) => pr.user?.login)
    .map((pr) => {
      const additions = pr.additions ?? 0;
      const deletions = pr.deletions ?? 0;
      const changedFiles = pr.changed_files ?? 0;
      const churn = additions + deletions;
      const riskScore = computeRiskScore(additions, deletions, changedFiles);
      const severity = severityFromMetrics(riskScore, changedFiles, churn);

      return {
        id: `${pr.owner}/${pr.repo}#${pr.number}`,
        owner: pr.owner,
        repo: pr.repo,
        number: pr.number,
        title: pr.title,
        developer: pr.user!.login,
        developerAvatar: pr.user!.avatar_url,
        riskScore,
        critical: severity.critical,
        high: severity.high,
        medium: severity.medium,
        fixesAccepted: Math.max(0, pr.commits ?? 0),
        timeToResolveHours: hoursToResolve(pr.created_at, pr.merged_at),
        htmlUrl: pr.html_url,
        createdAt: pr.created_at,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const byAuthor = new Map<string, TeamAnalyticsPRRow[]>();
  for (const row of rows) {
    const list = byAuthor.get(row.developer) ?? [];
    list.push(row);
    byAuthor.set(row.developer, list);
  }

  const allLogins = [...new Set([...contributors.keys(), ...byAuthor.keys()])];
  const profiles = await enrichUserProfiles(allLogins, token);
  const allDevelopers = buildDeveloperCards(contributors, byAuthor, profiles, monthSpan);
  const developers = allDevelopers.slice(0, MAX_DEVELOPER_CARDS);

  return {
    developers,
    pullRequests: rows,
    dateRange: { since: sinceStr, until: untilStr },
    reposScanned: repos.length,
    meta: {
      totalPrs: rows.length,
      totalContributors: allDevelopers.length,
      developersShown: developers.length,
      note: "Contributors from GitHub repos; PR metrics from change volume and merge timing.",
    },
  };
}
