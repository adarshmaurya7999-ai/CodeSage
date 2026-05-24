import dotenv from "dotenv";
import { createInstallationOctokit } from "./auth";

export interface FileDiff {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed";
  patch: string;
  additions: number;
  deletions: number;
  changedLineNumbers: number[];
}

const ALLOWED_STATUS = new Set<FileDiff["status"]>([
  "added",
  "modified",
  "removed",
  "renamed",
]);

/**
 * Parses unified-diff hunks to collect right-side line numbers (+ and context lines).
 */
function parseChangedLineNumbers(patch: string): number[] {
  const changed: number[] = [];
  const lines = patch.split("\n");
  let newLine = 0;
  let inHunk = false;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)(?:,(\d+))?/);
      if (match) {
        newLine = parseInt(match[1], 10);
        inHunk = true;
      }
      continue;
    }

    if (!inHunk || line.length === 0) {
      continue;
    }

    const prefix = line[0];

    if (prefix === "+") {
      changed.push(newLine);
      newLine += 1;
    } else if (prefix === " ") {
      changed.push(newLine);
      newLine += 1;
    } else if (prefix === "-") {
      // Deletions do not advance the right-side line counter
    }
  }

  return changed;
}

function normalizeStatus(status: string): FileDiff["status"] {
  if (ALLOWED_STATUS.has(status as FileDiff["status"])) {
    return status as FileDiff["status"];
  }
  return "modified";
}

/**
 * Fetches PR file diffs for an installation using the GitHub App.
 */
export async function fetchPRDiff(
  owner: string,
  repo: string,
  pullNumber: number,
  installationId: number,
): Promise<FileDiff[]> {
  try {
    const octokit = createInstallationOctokit(installationId);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return files
      .filter((file) => file.patch !== undefined && file.patch.length > 0)
      .map((file) => ({
        filename: file.filename,
        status: normalizeStatus(file.status),
        patch: file.patch as string,
        additions: file.additions,
        deletions: file.deletions,
        changedLineNumbers: parseChangedLineNumbers(file.patch as string),
      }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[fetchDiff] Error: ${message}`);
    throw err;
  }
}

// One-time manual test: npx tsx src/github/fetchDiff.ts <owner> <repo> <prNumber> <installationId>
if (require.main === module) {
  dotenv.config();

  const [owner, repo, pullNumberArg, installationIdArg] = process.argv.slice(2);

  if (!owner || !repo || !pullNumberArg || !installationIdArg) {
    console.error(
      "Usage: npx tsx src/github/fetchDiff.ts <owner> <repo> <pullNumber> <installationId>",
    );
    process.exit(1);
  }

  fetchPRDiff(owner, repo, Number(pullNumberArg), Number(installationIdArg))
    .then((diffs) => {
      console.log(JSON.stringify(diffs, null, 2));
    })
    .catch(() => process.exit(1));
}
