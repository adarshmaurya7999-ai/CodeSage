import type { DiffLine } from "@/lib/mock-data";

/**
 * Converts a unified diff patch into diff viewer rows.
 */
export function parsePatchToDiffLines(patch: string): DiffLine[] {
  const result: DiffLine[] = [];
  const lines = patch.split("\n");
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;

  for (const raw of lines) {
    if (raw.startsWith("@@")) {
      const match = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = Number.parseInt(match[1], 10);
        newLine = Number.parseInt(match[2], 10);
        inHunk = true;
      }
      continue;
    }

    if (!inHunk || raw.startsWith("\\")) {
      continue;
    }

    if (raw.length === 0) {
      continue;
    }

    const prefix = raw[0];
    const content = raw.slice(1);

    if (prefix === "+") {
      result.push({ oldNum: null, newNum: newLine, content, type: "add" });
      newLine += 1;
    } else if (prefix === "-") {
      result.push({ oldNum: oldLine, newNum: null, content, type: "remove" });
      oldLine += 1;
    } else if (prefix === " ") {
      result.push({ oldNum: oldLine, newNum: newLine, content, type: "context" });
      oldLine += 1;
      newLine += 1;
    }
  }

  return result;
}
