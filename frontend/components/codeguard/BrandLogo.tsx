"use client";

import { ShieldIcon } from "./icons";

interface BrandLogoProps {
  as?: "div" | "button";
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}

export function BrandLogo({
  as = "div",
  onClick,
  className = "",
  "aria-label": ariaLabel,
}: BrandLogoProps) {
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] text-[var(--accent)]"
        style={{ boxShadow: "0 0 18px rgba(0, 212, 170, 0.3)" }}
      >
        <ShieldIcon className="h-5 w-5" />
      </span>
      <span className="brand-logo-text">
        CodeSage <span className="brand-logo-ai">AI</span>
      </span>
    </>
  );

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`brand-logo hover-lift rounded-lg px-1 py-0.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`brand-logo ${className}`}>{content}</div>;
}
