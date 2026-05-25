"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AnalysisResult, LoadedPR, PRViewState } from "@/lib/github/types";
import type { DiffLine, Finding, PRCommit } from "@/lib/review/types";

const EMPTY_VIEW: PRViewState = {
  repository: "—",
  branch: "—",
  number: 0,
  title: "Select a pull request",
  status: "open",
  author: "—",
  created: "—",
  dangerScore: 0,
  riskLabel: "Not analyzed",
  filePath: "",
  diffStats: { additions: 0, deletions: 0 },
};

interface PRDataContextValue {
  prView: PRViewState;
  prSessionKey: string | null;
  files: LoadedPR["files"];
  commits: PRCommit[];
  selectedFilePath: string;
  setSelectedFilePath: (path: string) => void;
  selectedFileDiffLines: DiffLine[];
  findings: Finding[];
  analysisSummary: string | null;
  loadingPR: boolean;
  loadingCommits: boolean;
  analyzing: boolean;
  hasAnalysis: boolean;
  error: string | null;
  isLivePR: boolean;
  loadPullRequest: (owner: string, repo: string, pullNumber: number) => Promise<void>;
  runAnalysis: () => Promise<void>;
  clearError: () => void;
}

const PRDataContext = createContext<PRDataContextValue | null>(null);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function applyFindingFlags(lines: DiffLine[], filePath: string, findings: Finding[]): DiffLine[] {
  if (!findings.length) {
    return lines;
  }

  return lines.map((line) => {
    const matches = findings.some(
      (f) =>
        (f.file === filePath || f.file.endsWith(filePath) || filePath.endsWith(f.file)) &&
        f.line != null &&
        (f.line === line.newNum || f.line === line.oldNum),
    );
    if (matches && line.type !== "remove") {
      return { ...line, type: "flagged" as const };
    }
    return line;
  });
}

export function PRDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<LoadedPR | null>(null);
  const [commits, setCommits] = useState<PRCommit[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [dangerMeta, setDangerMeta] = useState({ score: 0, label: "Not analyzed" });
  const [loadingPR, setLoadingPR] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchCommits = useCallback(async (owner: string, repo: string, pullNumber: number) => {
    setLoadingCommits(true);
    try {
      const res = await fetch(
        `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/commits`,
      );
      const json = (await res.json()) as { commits?: PRCommit[] };
      setCommits(json.commits ?? []);
    } catch {
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  }, []);

  const loadPullRequest = useCallback(
    async (owner: string, repo: string, pullNumber: number) => {
      setLoadingPR(true);
      setError(null);
      setHasAnalysis(false);
      setAnalysisSummary(null);
      setFindings([]);
      setCommits([]);

      try {
        const res = await fetch(
          `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/files`,
        );
        const json = (await res.json()) as LoadedPR & { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load pull request");
        }
        if (!json.files.length) {
          throw new Error("This pull request has no changed files to display.");
        }

        setLoaded(json);
        setSelectedFilePath(json.files[0].filename);
        setDangerMeta({ score: 0, label: "Not analyzed" });
        void fetchCommits(owner, repo, pullNumber);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load PR";
        setError(message);
        throw err;
      } finally {
        setLoadingPR(false);
      }
    },
    [fetchCommits],
  );

  const runAnalysis = useCallback(async () => {
    if (!loaded) {
      setError("Load a pull request before running analysis.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const analysisRes = await fetch("/api/analyze-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: loaded.owner,
          repo: loaded.repo,
          pull: loaded.pull,
          files: loaded.files,
        }),
      });
      const analysis = (await analysisRes.json()) as AnalysisResult & { error?: string };

      if (!analysisRes.ok || !analysis.findings) {
        const msg = analysis.error ?? "Analysis failed";
        if (analysisRes.status === 402) {
          throw new Error(
            `${msg} Try adding credits at openrouter.ai/settings, or set OPENROUTER_MAX_TOKENS=1024 in .env.local.`,
          );
        }
        throw new Error(msg);
      }

      setFindings(analysis.findings);
      setAnalysisSummary(analysis.summary);
      setDangerMeta({ score: analysis.dangerScore, label: analysis.riskLabel });
      setHasAnalysis(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }, [loaded]);

  const isLivePR = loaded != null;

  const prSessionKey = useMemo(() => {
    if (!loaded) {
      return null;
    }
    return `${loaded.owner}/${loaded.repo}#${loaded.pull.number}`;
  }, [loaded]);

  const prView = useMemo((): PRViewState => {
    if (!loaded) {
      return EMPTY_VIEW;
    }
    const file =
      loaded.files.find((f) => f.filename === selectedFilePath) ?? loaded.files[0];
    return {
      repository: `${loaded.owner}/${loaded.repo}`,
      branch: `${loaded.pull.head.ref} → ${loaded.pull.base.ref}`,
      number: loaded.pull.number,
      title: loaded.pull.title,
      status: loaded.pull.state === "open" ? "open" : "closed",
      author: loaded.pull.user.login,
      created: formatDate(loaded.pull.created_at),
      dangerScore: dangerMeta.score,
      riskLabel: dangerMeta.label,
      filePath: file?.filename ?? "",
      diffStats: file
        ? { additions: file.additions, deletions: file.deletions }
        : { additions: loaded.pull.additions, deletions: loaded.pull.deletions },
    };
  }, [loaded, selectedFilePath, dangerMeta]);

  const activeFindings = isLivePR && !hasAnalysis && !analyzing ? [] : findings;

  const selectedFileDiffLines = useMemo((): DiffLine[] => {
    if (!loaded) {
      return [];
    }
    const file =
      loaded.files.find((f) => f.filename === selectedFilePath) ?? loaded.files[0];
    const lines = file?.diffLines ?? [];
    return applyFindingFlags(lines, file?.filename ?? "", activeFindings);
  }, [loaded, selectedFilePath, activeFindings]);

  const value: PRDataContextValue = {
    prView,
    prSessionKey,
    files: loaded?.files ?? [],
    commits,
    selectedFilePath,
    setSelectedFilePath,
    selectedFileDiffLines,
    findings: activeFindings,
    analysisSummary,
    loadingPR,
    loadingCommits,
    analyzing,
    hasAnalysis,
    error,
    isLivePR,
    loadPullRequest,
    runAnalysis,
    clearError,
  };

  return <PRDataContext.Provider value={value}>{children}</PRDataContext.Provider>;
}

export function usePRData(): PRDataContextValue {
  const ctx = useContext(PRDataContext);
  if (!ctx) {
    throw new Error("usePRData must be used within PRDataProvider");
  }
  return ctx;
}
