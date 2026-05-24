"use client";

const HUD_LABELS = [
  "PR_SCAN",
  "RISK_MODEL",
  "DIFF_PARSE",
  "AI_CORE",
  "THREAT_MAP",
  "SYNTAX_OK",
];

export function JarvisBackground() {
  return (
    <div className="jarvis-bg" aria-hidden>
      <div className="jarvis-grid" />
      <div className="jarvis-grid jarvis-grid-fine" />

      <div className="jarvis-orb jarvis-orb-1" />
      <div className="jarvis-orb jarvis-orb-2" />
      <div className="jarvis-orb jarvis-orb-3" />

      <svg className="jarvis-ring jarvis-ring-tl" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgba(139,92,246,0.12)"
          strokeWidth="1"
          strokeDasharray="8 12"
          className="jarvis-ring-spin"
        />
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="rgba(34,211,238,0.15)"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="jarvis-ring-spin-reverse"
        />
      </svg>

      <svg className="jarvis-ring jarvis-ring-br" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="rgba(34,211,238,0.1)"
          strokeWidth="1"
          strokeDasharray="6 10"
          className="jarvis-ring-spin-slow"
        />
      </svg>

      <div className="jarvis-scanline" />
      <div className="jarvis-scanline jarvis-scanline-2" />

      <div className="jarvis-hud jarvis-hud-left">
        {HUD_LABELS.slice(0, 3).map((label, i) => (
          <span key={label} className="jarvis-hud-line" style={{ animationDelay: `${i * 0.4}s` }}>
            <span className="jarvis-hud-dot" />
            {label}
          </span>
        ))}
      </div>

      <div className="jarvis-hud jarvis-hud-right">
        {HUD_LABELS.slice(3).map((label, i) => (
          <span key={label} className="jarvis-hud-line" style={{ animationDelay: `${i * 0.5}s` }}>
            <span className="jarvis-hud-dot" />
            {label}
          </span>
        ))}
      </div>

      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="jarvis-particle"
          style={{
            left: `${8 + ((i * 17) % 84)}%`,
            top: `${10 + ((i * 23) % 80)}%`,
            animationDelay: `${i * 0.35}s`,
            animationDuration: `${4 + (i % 5)}s`,
          }}
        />
      ))}

      <div className="jarvis-crosshair jarvis-crosshair-c" />
      <div className="jarvis-pulse-ring" />
    </div>
  );
}
