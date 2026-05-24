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
import type { DiffLine, Finding } from "@/lib/mock-data";
import { diffLines as mockDiffLines, findings as mockFindings, prData as mockPrData } from "@/lib/mock-data";

interface PRDataContextValue {
  prView: PRViewState;
  files: LoadedPR["files"];
  selectedFilePath: string;
  setSelectedFilePath: (path: string) => void;
  selectedFileDiffLines: DiffLine[];
  findings: Finding[];
  analysisSummary: string | null;
  loadingPR: boolean;
  analyzing: boolean;
  error: string | null;
  isLivePR: boolean;
  loadPullRequest: (owner: string, repo: string, pullNumber: number) => Promise<void>;
  clearError: () => void;
}

const PRDataContext = createContext<PRDataContextValue | null>(null);

const defaultView: PRViewState = {
  repository: mockPrData.repository,
  branch: mockPrData.branch,
  number: mockPrData.number,
  title: mockPrData.title,
  status: mockPrData.status,
  author: mockPrData.author,
  created: mockPrData.created,
  dangerScore: mockPrData.dangerScore,
  riskLabel: mockPrData.riskLabel,
  filePath: mockPrData.filePath,
  diffStats: mockPrData.diffStats,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PRDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<LoadedPR | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [findings, setFindings] = useState<Finding[]>(mockFindings);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [dangerMeta, setDangerMeta] = useState({
    score: mockPrData.dangerScore,
    label: mockPrData.riskLabel,
  });
  const [loadingPR, setLoadingPR] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadPullRequest = useCallback(async (owner: string, repo: string, pullNumber: number) => {
    setLoadingPR(true);
    setError(null);
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

      setAnalyzing(true);
      const analysisRes = await fetch("/api/analyze-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, pull: json.pull, files: json.files }),
      });
      const analysis = (await analysisRes.json()) as AnalysisResult & { error?: string };
      setAnalyzing(false);

      if (analysisRes.ok && analysis.findings) {
        setFindings(analysis.findings.length > 0 ? analysis.findings : mockFindings);
        setAnalysisSummary(analysis.summary);
        setDangerMeta({ score: analysis.dangerScore, label: analysis.riskLabel });
      } else {
        setFindings(mockFindings);
        setDangerMeta({ score: mockPrData.dangerScore, label: mockPrData.riskLabel });
        setError(analysis.error ?? "Analysis failed — showing demo findings.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load PR";
      setError(message);
      throw err;
    } finally {
      setLoadingPR(false);
      setAnalyzing(false);
    }
  }, []);

  const isLivePR = loaded != null;

  const prView = useMemo((): PRViewState => {
    if (!loaded) return defaultView;
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
      filePath: file?.filename ?? defaultView.filePath,
      diffStats: file
        ? { additions: file.additions, deletions: file.deletions }
        : { additions: loaded.pull.additions, deletions: loaded.pull.deletions },
    };
  }, [loaded, selectedFilePath, dangerMeta]);

  const selectedFileDiffLines = useMemo((): DiffLine[] => {
    if (!loaded) return mockDiffLines;
    const file =
      loaded.files.find((f) => f.filename === selectedFilePath) ?? loaded.files[0];
    return file?.diffLines ?? [];
  }, [loaded, selectedFilePath]);

  const value: PRDataContextValue = {
    prView,
    files: loaded?.files ?? [],
    selectedFilePath: selectedFilePath || prView.filePath,
    setSelectedFilePath,
    selectedFileDiffLines,
    findings,
    analysisSummary,
    loadingPR,
    analyzing,
    error,
    isLivePR,
    loadPullRequest,
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
