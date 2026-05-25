import type { PRFile } from "@/lib/github/types";

const SKIP_FILENAME = [
  /^package-lock\.json$/i,
  /^yarn\.lock$/i,
  /^pnpm-lock\.yaml$/i,
  /^composer\.lock$/i,
  /^Cargo\.lock$/i,
  /\.min\.(js|css)$/i,
  /^dist\//i,
  /^node_modules\//i,
  /\.(png|jpg|jpeg|gif|svg|ico|woff2?)$/i,
];

const SOURCE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|cs|cpp|c|h|rb|php|swift|kt)$/i;

function shouldSkip(filename: string): boolean {
  return SKIP_FILENAME.some((re) => re.test(filename));
}

function filePriority(filename: string): number {
  if (shouldSkip(filename)) return 100;
  if (SOURCE_EXT.test(filename)) return 0;
  if (/\.(json|ya?ml|toml|env)$/i.test(filename)) return 3;
  if (/\.(md|txt)$/i.test(filename)) return 4;
  return 6;
}

/**
 * Picks a small set of high-signal files so the OpenRouter prompt stays within credit limits.
 */
export function selectFilesForAnalysis(files: PRFile[], maxFiles = 6, maxPatchChars = 1200): PRFile[] {
  const candidates = files
    .filter((f) => f.patch && f.patch.trim().length > 0)
    .filter((f) => !shouldSkip(f.filename))
    .sort((a, b) => {
      const pa = filePriority(a.filename);
      const pb = filePriority(b.filename);
      if (pa !== pb) return pa - pb;
      return (a.patch?.length ?? 0) - (b.patch?.length ?? 0);
    })
    .slice(0, maxFiles);

  return candidates.map((f) => ({
    ...f,
    patch: f.patch!.slice(0, maxPatchChars),
  }));
}

export function buildAnalysisFileNote(totalFiles: number, selectedCount: number): string {
  if (selectedCount >= totalFiles) return "";
  return `\nNote: Analyzed ${selectedCount} of ${totalFiles} changed files (largest/low-signal files skipped to fit API limits).`;
}
