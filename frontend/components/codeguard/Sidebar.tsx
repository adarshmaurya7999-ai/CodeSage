"use client";

import { useEffect, useState } from "react";
import { usePRData } from "@/hooks/usePRData";
import { AIChatPanel } from "./AIChatPanel";
import { BrandLogo } from "./BrandLogo";

type SidebarTab = "changes" | "history";

export function Sidebar() {
  const { files, commits, selectedFilePath, setSelectedFilePath, loadingPR, loadingCommits, isLivePR } =
    usePRData();
  const [tab, setTab] = useState<SidebarTab>("changes");
  const [fileFilter, setFileFilter] = useState("");
  const [chatMinimized, setChatMinimized] = useState(true);

  useEffect(() => {
    const expandChat = () => setChatMinimized(false);
    const minimizeChat = () => setChatMinimized(true);
    window.addEventListener("codesage:expand-chat", expandChat);
    window.addEventListener("codesage:minimize-chat", minimizeChat);
    return () => {
      window.removeEventListener("codesage:expand-chat", expandChat);
      window.removeEventListener("codesage:minimize-chat", minimizeChat);
    };
  }, []);

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(fileFilter.toLowerCase()),
  );

  return (
    <aside className="sidebar-dock flex h-full w-[272px] shrink-0 flex-col">
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3.5">
        <BrandLogo />

        <div className="mt-3 flex border-b border-[var(--border)]">
          {(["changes", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 pb-2 text-[12px] font-medium capitalize transition ${
                tab === t
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {tab === "changes" ? (
          <>
            {!isLivePR && !loadingPR && (
              <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">
                Open Pull Requests and select a PR to see changed files.
              </p>
            )}
            {isLivePR && (
              <>
                <label className="mb-2 flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5">
                  <span className="text-[11px] text-[var(--text-muted)]">Filter</span>
                  <input
                    type="text"
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    placeholder="Search files"
                    className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </label>
                {loadingPR ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-3"
                      >
                        <div className="h-2 w-3/4 rounded bg-[var(--bg-sidebar)]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-[11px] text-[var(--text-muted)]">
                      {filteredFiles.length} changed file{filteredFiles.length !== 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-0.5">
                      {filteredFiles.map((file) => (
                        <li key={file.filename}>
                          <button
                            type="button"
                            onClick={() => setSelectedFilePath(file.filename)}
                            className={`hover-lift flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition ${
                              selectedFilePath === file.filename
                                ? "bg-[var(--bg-card)] ring-1 ring-[rgba(0,212,170,0.35)]"
                                : "hover:bg-[var(--bg-card)]/80"
                            }`}
                          >
                            <span
                              className={`file-indicator ${selectedFilePath === file.filename ? "file-indicator--active" : ""}`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-primary)]">
                                {file.filename}
                              </span>
                              <span className="mt-1 flex gap-1">
                                <span className="file-diff-badge file-diff-badge--add">
                                  +{file.additions}
                                </span>
                                <span className="file-diff-badge file-diff-badge--del">
                                  -{file.deletions}
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {!isLivePR && !loadingCommits && (
              <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">
                Commit history appears after you load a pull request.
              </p>
            )}
            {loadingCommits && (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-md bg-[var(--bg-card)] px-2 py-4" />
                ))}
              </div>
            )}
            {isLivePR && !loadingCommits && commits.length === 0 && (
              <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">No commits found.</p>
            )}
            <ul className="space-y-1">
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <div className="w-full rounded-md px-2 py-2.5">
                    <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                      {commit.message}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {commit.author} · {commit.date}
                    </p>
                    <code className="mt-0.5 block font-[family-name:var(--font-fira-code)] text-[10px] text-[var(--accent)]">
                      {commit.sha}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div
        className={`sidebar-chat-dock dock-panel shrink-0 border-t border-[var(--border)] p-2 ${
          chatMinimized ? "dock-panel--minimized sidebar-chat-dock--collapsed" : "sidebar-chat-dock--expanded"
        }`}
      >
        <AIChatPanel
          minimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized((v) => !v)}
        />
      </div>
    </aside>
  );
}
