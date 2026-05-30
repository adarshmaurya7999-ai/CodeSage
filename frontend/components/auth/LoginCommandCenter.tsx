"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { GitHubSignInButton } from "./GitHubSignInButton";

const SYSTEM_LABELS = [
  { id: "PR_SCAN", style: "login-label--tl" },
  { id: "THREAT_MAP", style: "login-label--tr" },
  { id: "AI_CORE", style: "login-label--bl" },
  { id: "DIFF_PARSE", style: "login-label--br" },
] as const;

const PARTICLE_POSITIONS = [
  [8, 12],
  [22, 78],
  [35, 34],
  [48, 88],
  [61, 18],
  [74, 52],
  [88, 72],
  [15, 45],
  [42, 8],
  [55, 62],
  [68, 28],
  [92, 38],
  [5, 65],
  [28, 92],
  [78, 8],
  [33, 55],
  [85, 85],
  [12, 28],
] as const;

interface LoginCommandCenterProps {
  authFailed?: boolean;
  failReason?: string | null;
}

export function LoginCommandCenter({ authFailed, failReason }: LoginCommandCenterProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = sceneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointer({ x, y });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointer({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={sceneRef}
      className="login-command-center"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          "--pointer-x": `${pointer.x}%`,
          "--pointer-y": `${pointer.y}%`,
        } as React.CSSProperties
      }
    >
      <div className="login-command-center__aurora" aria-hidden />

      <div
        className={`login-emblem-scene ${mounted ? "login-emblem-scene--in" : ""}`}
        aria-hidden
      >
        <div className="login-emblem-glow login-emblem-glow--violet" />
        <div className="login-emblem-glow login-emblem-glow--cyan" />
        <div className="login-emblem-orbit login-emblem-orbit--outer">
          <span className="login-emblem-orbit__dot" />
          <span className="login-emblem-orbit__dot login-emblem-orbit__dot--2" />
          <span className="login-emblem-orbit__dot login-emblem-orbit__dot--3" />
        </div>
        <div className="login-emblem-orbit login-emblem-orbit--inner">
          <span className="login-emblem-orbit__dot" />
          <span className="login-emblem-orbit__dot login-emblem-orbit__dot--2" />
        </div>
        <div className="login-emblem-ring" />
        <div className="login-emblem-parallax">
          <div className="login-emblem-ghost">
            <Image
              src="/codesage-logo.png"
              alt=""
              width={480}
              height={480}
              className="login-emblem-ghost__img"
              priority
              aria-hidden
            />
          </div>
          <div className="login-emblem-core">
            <div className="login-emblem-shine" />
            <Image
              src="/codesage-logo.png"
              alt=""
              width={420}
              height={420}
              className="login-emblem-core__img"
              priority
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="login-command-center__grid" aria-hidden />
      <div className="login-command-center__scanlines" aria-hidden />
      <div
        className="login-command-center__mouse-glow"
        aria-hidden
        style={{
          opacity: mounted ? 1 : 0,
        }}
      />

      <div className="login-command-center__particles" aria-hidden>
        {PARTICLE_POSITIONS.map(([left, top], i) => (
          <span
            key={i}
            className="login-particle"
            style={
              {
                "--i": i,
                left: `${left}%`,
                top: `${top}%`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {SYSTEM_LABELS.map((label, index) => (
        <div
          key={label.id}
          className={`login-system-label ${label.style} ${mounted ? "login-system-label--in" : ""}`}
          style={{ transitionDelay: `${0.2 + index * 0.1}s` } as React.CSSProperties}
        >
          <span className="login-system-label__dot" />
          {label.id}
        </div>
      ))}

      <div className="login-command-center__content">
        <div
          className={`login-glass-card ${mounted ? "login-glass-card--in" : ""}`}
          role="main"
        >
          <header
            className="login-glass-card__header login-stagger"
            style={{ "--stagger": 0 } as React.CSSProperties}
          >
            <div className="login-glass-card__icon-wrap">
              <Image
                src="/codesage-logo.png"
                alt=""
                width={44}
                height={44}
                className="login-glass-card__logo"
                priority
              />
            </div>
            <p className="login-glass-card__eyebrow">CodeSage AI</p>
            <h1 className="login-glass-card__title">Engineering command center</h1>
            <p className="login-glass-card__subtitle">
              Authenticate to access PR intelligence, threat mapping, and AI-assisted code review.
            </p>
          </header>

          {authFailed && (
            <div
              className="login-glass-card__alert login-stagger"
              style={{ "--stagger": 1 } as React.CSSProperties}
              role="alert"
            >
              <p>Sign-in failed. Please try again.</p>
              {failReason && <p className="login-glass-card__alert-detail">{failReason}</p>}
            </div>
          )}

          <div
            className="login-stagger"
            style={{ "--stagger": authFailed ? 2 : 1 } as React.CSSProperties}
          >
            <GitHubSignInButton variant="command-center" />
          </div>

          <footer
            className="login-glass-card__footer login-stagger"
            style={{ "--stagger": authFailed ? 3 : 2 } as React.CSSProperties}
          >
            <span className="login-status-pill">
              <span className="login-status-pill__pulse" />
              Systems nominal
            </span>
            <p className="login-glass-card__legal">
              Secure GitHub OAuth · Enterprise-grade review pipeline
            </p>
          </footer>
        </div>

        <p
          className={`login-command-center__version login-stagger ${mounted ? "login-stagger--in" : ""}`}
          style={{ "--stagger": 4 } as React.CSSProperties}
        >
          v2.0 · Neural diff analysis
        </p>
      </div>
    </div>
  );
}
