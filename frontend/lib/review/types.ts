export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line?: number;
}

export interface DiffLine {
  oldNum: number | null;
  newNum: number | null;
  content: string;
  type: "context" | "add" | "remove" | "flagged";
  commentCount?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export interface PRCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}
