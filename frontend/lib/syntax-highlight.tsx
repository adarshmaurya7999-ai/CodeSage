import type { ReactNode } from "react";

const KEYWORDS = new Set([
  "async",
  "function",
  "const",
  "let",
  "var",
  "await",
  "if",
  "else",
  "throw",
  "return",
  "new",
  "import",
  "from",
  "export",
  "class",
  "interface",
  "type",
]);

export function highlightCode(code: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const regex =
    /(`[^`]*`|"[^"]*"|'[^']*'|\b\d+\b|\b[A-Z][a-zA-Z0-9]*\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|[^\s\w`"'$]+|\s+)/g;

  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(code)) !== null) {
    const part = match[0];

    if (/^\s+$/.test(part)) {
      tokens.push(<span key={key++}>{part}</span>);
      continue;
    }

    if (/^`/.test(part) || /^["']/.test(part)) {
      tokens.push(
        <span key={key++} style={{ color: "var(--syntax-string)" }}>
          {part}
        </span>,
      );
      continue;
    }

    if (/^\d+$/.test(part)) {
      tokens.push(
        <span key={key++} style={{ color: "var(--syntax-number)" }}>
          {part}
        </span>,
      );
      continue;
    }

    if (/^[A-Z]/.test(part)) {
      tokens.push(
        <span key={key++} style={{ color: "var(--syntax-type)" }}>
          {part}
        </span>,
      );
      continue;
    }

    if (KEYWORDS.has(part)) {
      tokens.push(
        <span key={key++} style={{ color: "var(--syntax-keyword)" }}>
          {part}
        </span>,
      );
      continue;
    }

    if (part.endsWith("(")) {
      tokens.push(
        <span key={key++} style={{ color: "var(--syntax-fn)" }}>
          {part}
        </span>,
      );
      continue;
    }

    tokens.push(
      <span key={key++} style={{ color: "var(--syntax-var)" }}>
        {part}
      </span>,
    );
  }

  return tokens;
}
