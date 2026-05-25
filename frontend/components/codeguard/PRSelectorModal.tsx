"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PullRequest, Repository } from "@/lib/github/types";
import { usePRData } from "@/hooks/usePRData";

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

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-3">
      <div className="h-3 w-1/2 rounded bg-[var(--bg-card)]" />
      <div className="mt-2 h-2 w-1/3 rounded bg-[var(--bg-card)]" />
    </div>
  );
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="pr-modal-root fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[min(640px,90vh)] w-full max-w-[520px] flex-col overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--bg-panel)] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-labelledby="pr-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p
              id="pr-modal-title"
              className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]"
            >
              {step === "repos" ? "Select Repository" : "Select Pull Request"}
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              <span className={step === "repos" ? "text-[var(--text-primary)]" : ""}>
                Select Repository
              </span>
              <span className="mx-1.5">→</span>
              <span className={step === "pulls" ? "text-[var(--text-primary)]" : ""}>
                Select Pull Request
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-sidebar)] hover:text-[var(--text-primary)]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-[var(--border)] px-5 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={step === "repos" ? "Search repositories…" : "Search pull requests…"}
            className="w-full rounded-lg border border-[rgba(0,212,170,0.27)] bg-[var(--bg-sidebar)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(0,212,170,0.15)]"
          />
          {step === "pulls" && selectedRepo && (
            <button
              type="button"
              onClick={() => {
                setStep("repos");
                setSearch("");
                setPulls([]);
              }}
              className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
            >
              ← Back to repositories
            </button>
          )}
        </div>

        {error && (
          <p className="mx-5 mt-3 rounded-md border border-[rgba(255,71,87,0.35)] bg-[rgba(255,71,87,0.1)] px-3 py-2 text-[12px] text-[var(--critical)]">
            {error}
          </p>
        )}

        <div className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
          {loading || loadingPR ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : step === "repos" ? (
            <ul className="space-y-1">
              {filteredRepos.map((repo) => (
                <li key={repo.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelectRepo(repo)}
                    className="pr-modal-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--bg-sidebar)]"
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
            <ul className="space-y-1">
              {filteredPulls.map((pull) => (
                <li key={pull.number}>
                  <button
                    type="button"
                    onClick={() => void handleSelectPull(pull)}
                    className="pr-modal-item flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--bg-sidebar)]"
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
      </div>
    </div>,
    document.body,
  );
}
