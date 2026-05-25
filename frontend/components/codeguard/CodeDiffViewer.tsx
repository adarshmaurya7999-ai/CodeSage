"use client";

import { usePRData } from "@/hooks/usePRData";
import { highlightCode } from "@/lib/syntax-highlight";
import { useReview } from "./ReviewContext";
import { ChevronDownIcon, WarningShieldIcon } from "./icons";

function DiffCode({ code }: { code: string }) {
  const cleaned = code.replace(/^\+\s*/, "");
  return (
    <code
      className="font-[family-name:var(--font-fira-code)] text-[12px] leading-[1.65]"
      style={{ fontFeatureSettings: '"liga" 1, "calt" 1' }}
    >
      {highlightCode(cleaned)}
    </code>
  );
}

export function CodeDiffViewer() {
  const { highlightedLine } = useReview();
  const { prView, selectedFileDiffLines, loadingPR, isLivePR } = usePRData();

  if (!isLivePR && !loadingPR) {
    return (
      <div className="diff-container panel-card flex min-h-0 flex-1 flex-col items-center justify-center p-8">
        <p className="text-center text-[14px] text-[var(--text-secondary)]">
          Select a pull request to view file changes.
        </p>
      </div>
    );
  }

  return (
    <div className="diff-container panel-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[rgba(0,0,0,0.2)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-[family-name:var(--font-fira-code)] text-[12px] text-[var(--text-primary)]">
            {prView.filePath || "—"}
          </span>
          {prView.filePath && (
            <>
              <span className="shrink-0 font-[family-name:var(--font-jetbrains)] text-[11px] font-medium text-[var(--success)]">
                +{prView.diffStats.additions}
              </span>
              <span className="shrink-0 font-[family-name:var(--font-jetbrains)] text-[11px] font-medium text-[var(--critical)]">
                -{prView.diffStats.deletions}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          className="rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          aria-label="File options"
        >
          <ChevronDownIcon />
        </button>
      </div>

      {loadingPR ? (
        <div className="min-h-0 flex-1 space-y-1 overflow-auto p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : selectedFileDiffLines.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-[13px] text-[var(--text-muted)]">
          No diff lines for this file.
        </div>
      ) : (
        <div className="scroll-thin min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <tbody>
              {selectedFileDiffLines.map((line, i) => {
                const isAdd = line.type === "add";
                const isRemove = line.type === "remove";
                const isFlagged = line.type === "flagged";
                const isHighlighted =
                  highlightedLine != null &&
                  (line.newNum === highlightedLine || line.oldNum === highlightedLine);
                const rowClass = [
                  "diff-line diff-line-reveal group",
                  isAdd ? "diff-line-add" : "",
                  isRemove ? "diff-line-remove" : "",
                  isFlagged ? "diff-line-flagged" : "",
                  isHighlighted ? "diff-line-finding-highlight" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr
                    key={i}
                    id={line.newNum != null ? `diff-line-${line.newNum}` : undefined}
                    className={rowClass}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="w-7 select-none border-r border-[var(--border)] bg-[var(--bg-panel)] px-1.5 py-0 text-center">
                      {isFlagged && (
                        <span className="inline-flex text-[var(--critical)]">
                          <WarningShieldIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {isAdd && !isFlagged && (
                        <span className="text-[11px] font-bold text-[var(--success)]">+</span>
                      )}
                      {isRemove && (
                        <span className="text-[11px] font-bold text-[var(--critical)]">−</span>
                      )}
                    </td>
                    <td className="w-9 select-none border-r border-[var(--border)] bg-[var(--bg-base)] px-2 py-0 text-right font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-muted)]">
                      {line.oldNum ?? ""}
                    </td>
                    <td
                      className={`w-9 select-none border-r border-[var(--border)] bg-[var(--bg-base)] px-2 py-0 text-right font-[family-name:var(--font-fira-code)] text-[11px] ${
                        isHighlighted
                          ? "font-bold text-[var(--warning)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {line.newNum ?? ""}
                    </td>
                    <td className="relative whitespace-pre px-3 py-0">
                      {line.content ? <DiffCode code={line.content} /> : "\u00A0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
