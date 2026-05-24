"use client";

import { diffLines, prData } from "@/lib/mock-data";
import { highlightCode } from "@/lib/syntax-highlight";
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
  return (
    <div className="diff-container panel-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[rgba(0,0,0,0.2)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-fira-code)] text-[12px] text-[var(--text-primary)]">
            {prData.filePath}
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium text-[var(--success)]">
            +{prData.diffStats.additions}
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium text-[var(--danger)]">
            -{prData.diffStats.deletions}
          </span>
        </div>
        <button
          type="button"
          className="rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          <ChevronDownIcon />
        </button>
      </div>

      <div className="scroll-thin max-h-[340px] overflow-auto">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, i) => {
              const isAdd = line.type === "add";
              const isFlagged = line.type === "flagged";
              const rowClass = [
                "diff-line diff-line-reveal group",
                isAdd ? "diff-line-add" : "",
                isFlagged ? "diff-line-flagged" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr
                  key={i}
                  className={rowClass}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="w-7 select-none border-r border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0 text-center">
                    {isFlagged && (
                      <span className="inline-flex text-[var(--danger)] drop-shadow-[0_0_6px_var(--danger-glow)]">
                        <WarningShieldIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {isAdd && !isFlagged && (
                      <span className="diff-ln-add text-[11px] font-bold">+</span>
                    )}
                  </td>
                  <td className="w-9 select-none border-r border-[var(--border)] bg-[rgba(11,16,32,0.6)] px-2 py-0 text-right font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-muted)]">
                    {line.oldNum ?? ""}
                  </td>
                  <td className="w-9 select-none border-r border-[var(--border)] bg-[rgba(11,16,32,0.6)] px-2 py-0 text-right font-[family-name:var(--font-fira-code)] text-[11px] text-[var(--text-muted)]">
                    {line.newNum ?? ""}
                  </td>
                  <td className="relative whitespace-pre px-3 py-0">
                    {line.content ? <DiffCode code={line.content} /> : "\u00A0"}
                    {line.commentCount ? (
                      <span className="absolute right-3 top-1/2 flex h-[18px] min-w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        {line.commentCount}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
