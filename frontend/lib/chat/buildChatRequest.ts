import type { PRFile } from "@/lib/github/types";
import type { Finding } from "@/lib/review/types";
import type { PRViewState } from "@/lib/github/types";
import { buildPrCodeContextForChat, type FileDiffSnippet } from "./prCodeContext";

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiRequestBody {
  question: string;
  messages?: ChatApiMessage[];
  prContext?: {
    repository: string;
    number: number;
    title: string;
    branch: string;
    selectedFile?: string;
    analysisSummary?: string | null;
    changedFiles?: string[];
    fileDiffs?: FileDiffSnippet[];
    findings?: Array<{
      severity: string;
      title: string;
      file: string;
      line?: number;
      description?: string;
    }>;
  };
}

export function buildChatRequestBody(options: {
  question: string;
  priorMessages: Array<{ role: "user" | "ai"; content: string }>;
  prView: PRViewState;
  files: PRFile[];
  selectedFilePath: string;
  hasAnalysis: boolean;
  analysisSummary: string | null;
  findings: Finding[];
}): ChatApiRequestBody {
  const {
    question,
    priorMessages,
    prView,
    files,
    selectedFilePath,
    hasAnalysis,
    analysisSummary,
    findings,
  } = options;

  const { changedFiles, fileDiffs } =
    files.length > 0
      ? buildPrCodeContextForChat(files, selectedFilePath)
      : { changedFiles: [] as string[], fileDiffs: [] as FileDiffSnippet[] };

  return {
    question: question.trim(),
    messages: priorMessages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
    prContext: {
      repository: prView.repository,
      title: prView.title,
      number: prView.number,
      branch: prView.branch,
      selectedFile: selectedFilePath || undefined,
      analysisSummary: hasAnalysis ? analysisSummary : undefined,
      changedFiles,
      fileDiffs,
      findings: hasAnalysis
        ? findings.map((f) => ({
            severity: f.severity,
            title: f.title,
            file: f.file,
            line: f.line,
            description: f.description,
          }))
        : undefined,
    },
  };
}

function parseFileDiffs(raw: unknown): FileDiffSnippet[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      filename: String(item.filename ?? ""),
      status: String(item.status ?? "modified"),
      additions: Number(item.additions ?? 0),
      deletions: Number(item.deletions ?? 0),
      patch: String(item.patch ?? ""),
      isPrimary: Boolean(item.isPrimary),
    }))
    .filter((f) => f.filename && f.patch);
}

/** Normalize legacy or alternate client payloads for /api/chat */
export function normalizeChatRequestBody(raw: Record<string, unknown>): ChatApiRequestBody {
  const question =
    (typeof raw.question === "string" && raw.question.trim()) ||
    (typeof raw.message === "string" && raw.message.trim()) ||
    "";

  const prRaw = (raw.prContext ?? raw.pr) as Record<string, unknown> | undefined;

  let prContext: ChatApiRequestBody["prContext"];
  if (prRaw && typeof prRaw === "object") {
    prContext = {
      repository: String(prRaw.repository ?? ""),
      number: Number(prRaw.number ?? 0),
      title: String(prRaw.title ?? ""),
      branch: String(prRaw.branch ?? ""),
      selectedFile:
        (typeof prRaw.selectedFile === "string" && prRaw.selectedFile) ||
        (typeof prRaw.selectedFilePath === "string" && prRaw.selectedFilePath) ||
        undefined,
      analysisSummary:
        (typeof prRaw.analysisSummary === "string" ? prRaw.analysisSummary : null) ??
        (typeof prRaw.summary === "string" ? prRaw.summary : null) ??
        undefined,
      changedFiles: Array.isArray(prRaw.changedFiles)
        ? prRaw.changedFiles.map(String)
        : undefined,
      fileDiffs: parseFileDiffs(prRaw.fileDiffs),
      findings: Array.isArray(prRaw.findings)
        ? (prRaw.findings as NonNullable<ChatApiRequestBody["prContext"]>["findings"])
        : undefined,
    };
  }

  const messages = Array.isArray(raw.messages)
    ? (raw.messages as ChatApiMessage[])
    : undefined;

  return { question, messages, prContext };
}
