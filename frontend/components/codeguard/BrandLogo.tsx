"use client";

import Image from "next/image";

const LOGO_SRC = "/codesage-logo.png";

interface BrandLogoProps {
  as?: "div" | "button";
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  showWordmark?: boolean;
  "aria-label"?: string;
}

export function BrandLogo({
  as = "div",
  onClick,
  className = "",
  size = "md",
  showWordmark = true,
  "aria-label": ariaLabel,
}: BrandLogoProps) {
  const iconPx = size === "sm" ? 32 : 40;

  const content = (
    <>
      <span
        className="brand-logo__icon-wrap"
        style={{ width: iconPx, height: iconPx }}
      >
        <Image
          src={LOGO_SRC}
          alt=""
          width={iconPx}
          height={iconPx}
          className="brand-logo__icon"
          priority
        />
      </span>
      {showWordmark && (
        <span className="brand-logo-text">
          <span className="brand-logo-word">CODESAGE</span>
          <span className="brand-logo-ai"> AI</span>
        </span>
      )}
    </>
  );

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? "CodeSage AI"}
        className={`brand-logo brand-logo--interactive hover-lift rounded-lg px-1 py-0.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
        data-size={size}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`brand-logo ${className}`} data-size={size}>
      {content}
    </div>
  );
}
