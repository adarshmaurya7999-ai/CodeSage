"use client";

import { useCallback, useEffect, useState } from "react";
import type { PullRequest, Repository } from "@/lib/github/types";
import { usePRData } from "@/hooks/usePRData";
import { Button, Input, Modal, SkeletonList } from "@/components/ui";

interface PRSelectorModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "repos" | "pulls";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function PRSelectorModal({ open, onClose }: PRSelectorModalProps) {
  const { loadPullRequest } = usePRData();
  const [step, setStep] = useState<Step>("repos");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPR, setLoadingPR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/github/repos");
      const json = (await res.json()) as { repos?: Repository[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load repositories");
      setRepos(json.repos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPulls = useCallback(async (repo: Repository) => {
    setLoading(true);
    setError(null);
    setPulls([]);
    try {
      const owner = repo.owner.login;
      const name = repo.name;
      const res = await fetch(
        `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as {
        pulls?: PullRequest[];
        error?: string;
        meta?: {
          count: number;
          usedFallback?: boolean;
          source?: string;
          hint?: string;
          debug?: {
            restOpen?: number;
            restAll?: number;
            issuesOpen?: number;
            repoOpenIssues?: number;
            oauthScopes?: string;
            lastError?: string;
          };
        };
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load pull requests");

      const list = json.pulls ?? [];
      setPulls(list);

      if (list.length === 0) {
        const debug = json.meta?.debug;
        if (debug?.restAll && debug.restAll > 0) {
          setError(
            `${owner}/${name} has ${debug.restAll} pull request(s) on GitHub, but none are open. Open or reopen a PR on GitHub, then try again.`,
          );
        } else if (json.meta?.hint === "no_prs_on_github" || debug?.restAll === 0) {
          setError(
            `GitHub shows no pull requests in ${owner}/${name} yet. Create one on GitHub (Pull requests → New pull request), then reopen this dialog.`,
          );
        } else if (
          debug?.oauthScopes &&
          !debug.oauthScopes.includes("repo")
        ) {
          setError(
            `Your GitHub token is missing the repo scope (current: ${debug.oauthScopes}). Sign out and sign in again, then approve repository access.`,
          );
        } else {
          const hint = debug?.lastError ? ` ${debug.lastError}` : "";
          setError(
            `No open pull requests found for ${owner}/${name}.${hint} Sign out and sign in again if you recently granted repo access.`,
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pull requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setStep("repos");
    setSelectedRepo(null);
    setSearch("");
    setPulls([]);
    void fetchRepos();
  }, [open, fetchRepos]);

  const filteredRepos = repos.filter((r) => {
    const q = search.toLowerCase();
    return r.full_name.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
  });

  const filteredPulls = pulls.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      String(p.number).includes(q) ||
      p.user.login.toLowerCase().includes(q)
    );
  });

  async function handleSelectRepo(repo: Repository) {
    setSelectedRepo(repo);
    setStep("pulls");
    setSearch("");
    await fetchPulls(repo);
  }

  async function handleSelectPull(pull: PullRequest) {
    if (!selectedRepo) return;
    const owner = selectedRepo.owner.login;
    const name = selectedRepo.name;
    setLoadingPR(true);
    setError(null);
    try {
      await loadPullRequest(owner, name, pull.number);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PR");
    } finally {
      setLoadingPR(false);
    }
  }

  const breadcrumb = (
    <>
      <span className={step === "repos" ? "text-[var(--text-primary)]" : ""}>
        Select Repository
      </span>
      <span className="mx-1.5" aria-hidden>
        →
      </span>
      <span className={step === "pulls" ? "text-[var(--text-primary)]" : ""}>
        Select Pull Request
      </span>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "repos" ? "Select Repository" : "Select Pull Request"}
      subtitle={breadcrumb}
      size="md"
      initialFocus="first-focusable"
    >
      <div className="border-b border-[var(--border)] px-5 py-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={step === "repos" ? "Search repositories…" : "Search pull requests…"}
          aria-label={step === "repos" ? "Search repositories" : "Search pull requests"}
          inputClassName="cs-input--search"
        />
        {step === "pulls" && selectedRepo && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 !justify-start !px-0 text-[var(--accent)]"
            onClick={() => {
              setStep("repos");
              setSearch("");
              setPulls([]);
            }}
          >
            ← Back to repositories
          </Button>
        )}
      </div>

      {error && (
        <p className="cs-alert cs-alert--error mx-5 mt-3" role="alert">
          {error}
        </p>
      )}

      <div className="px-3 py-3">
        {loading || loadingPR ? (
          <SkeletonList count={6} />
        ) : step === "repos" ? (
          <ul className="space-y-1" role="listbox" aria-label="Repositories">
            {filteredRepos.map((repo) => (
              <li key={repo.id}>
                <button
                  type="button"
                  onClick={() => void handleSelectRepo(repo)}
                  className="cs-modal-list-item pr-modal-item items-center"
                >
                    <img
                      src={repo.owner.avatar_url}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--text-primary)]">
                        {repo.full_name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Updated {formatRelative(repo.updated_at)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        repo.private
                          ? "bg-[var(--bg-card)] text-[var(--text-secondary)]"
                          : "bg-[var(--accent-subtle)] text-[var(--accent)]"
                      }`}
                    >
                      {repo.private ? "Private" : "Public"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
        ) : (
          <ul className="space-y-1" role="listbox" aria-label="Pull requests">
            {filteredPulls.map((pull) => (
              <li key={pull.number}>
                <button
                  type="button"
                  onClick={() => void handleSelectPull(pull)}
                  className="cs-modal-list-item pr-modal-item"
                >
                    <img
                      src={pull.user.avatar_url}
                      alt=""
                      className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[var(--accent)]">
                          #{pull.number}
                        </span>
                        <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                          {pull.title}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                        {pull.user.login} · {pull.head.ref} → {pull.base.ref}
                      </span>
                      <span className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        {pull.changed_files} files · opened {formatRelative(pull.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
        )}
      </div>
    </Modal>
  );
}
