import type { PRFile } from "@/lib/github/types";

export interface FileDiffSnippet {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
  isPrimary: boolean;
}

const DEFAULT_SELECTED_MAX = 10_000;
const DEFAULT_OTHER_MAX = 2_500;
const DEFAULT_MAX_OTHER_FILES = 2;

function getPatchText(file: PRFile, maxChars: number): string {
  if (file.patch?.trim()) {
    const p = file.patch.trim();
    if (p.length <= maxChars) return p;
    return `${p.slice(0, maxChars)}\n… [diff truncated at ${maxChars} characters]`;
  }

  if (file.diffLines?.length) {
    const lines = file.diffLines.map((line) => {
      const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
      const num =
        line.newNum != null
          ? String(line.newNum).padStart(4)
          : line.oldNum != null
            ? String(line.oldNum).padStart(4)
            : "    ";
      return `${prefix} ${num} ${line.content}`;
    });
    const body = lines.join("\n");
    if (body.length <= maxChars) return body;
    return `${body.slice(0, maxChars)}\n… [diff truncated]`;
  }

  if (file.content?.trim()) {
    const c = file.content.trim();
    if (c.length <= maxChars) return `(full file)\n${c}`;
    return `(full file, truncated)\n${c.slice(0, maxChars)}\n…`;
  }

  return "(no diff text available for this file)";
}

/**
 * Builds diff snippets for chat: full context for the selected file plus
 * abbreviated patches for a few other changed files.
 */
export function buildPrCodeContextForChat(
  files: PRFile[],
  selectedFilePath: string,
  options?: {
    selectedMaxChars?: number;
    otherMaxChars?: number;
    maxOtherFiles?: number;
  },
): { changedFiles: string[]; fileDiffs: FileDiffSnippet[] } {
  const selectedMax = options?.selectedMaxChars ?? DEFAULT_SELECTED_MAX;
  const otherMax = options?.otherMaxChars ?? DEFAULT_OTHER_MAX;
  const maxOther = options?.maxOtherFiles ?? DEFAULT_MAX_OTHER_FILES;

  const changedFiles = files.map((f) => f.filename);
  const selected =
    files.find((f) => f.filename === selectedFilePath) ?? files[0] ?? null;

  const fileDiffs: FileDiffSnippet[] = [];

  if (selected) {
    fileDiffs.push({
      filename: selected.filename,
      status: selected.status,
      additions: selected.additions,
      deletions: selected.deletions,
      patch: getPatchText(selected, selectedMax),
      isPrimary: true,
    });
  }

  const others = files
    .filter((f) => f.filename !== selected?.filename)
    .filter((f) => f.patch?.trim() || f.diffLines?.length || f.content?.trim())
    .slice(0, maxOther);

  for (const file of others) {
    fileDiffs.push({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: getPatchText(file, otherMax),
      isPrimary: false,
    });
  }

  return { changedFiles, fileDiffs };
}
