"use client";

import "./ask-sage.css";

const SAGE_AVATAR_SRC = "/sage-avatar.png";

export interface SageAvatarProps {
  /** Visual-only: mirrors existing chat `isSending` / loading flag */
  isThinking?: boolean;
  /** Visual-only: brief reply flourish after thinking ends */
  isResponding?: boolean;
  /** Hover, focus, or click interaction */
  isInteract?: boolean;
  className?: string;
  size?: number;
}

/**
 * Circular Sage avatar with GPU-only CSS animations.
 * No chat/API logic — receives visual flags from parent only.
 */
export function SageAvatar({
  isThinking = false,
  isResponding = false,
  isInteract = false,
  className = "",
  size = 36,
}: SageAvatarProps) {
  const phaseClass = isThinking
    ? "sage-avatar--thinking"
    : isResponding
      ? "sage-avatar--reply"
      : isInteract
        ? "sage-avatar--interact"
        : "";

  return (
    <span
      className={`sage-avatar ${phaseClass} ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <span className="sage-avatar__status-ring" aria-hidden />
      <span className="sage-avatar__orb-glow" aria-hidden />
      <span className="sage-avatar__hair-sway" aria-hidden />

      <span
        className="sage-avatar__frame"
        role="img"
        aria-label="Sage bot avatar"
      >
        {/* Native img — Next/Image wrapper prevented fill inside the circle */}
        <img
          src={SAGE_AVATAR_SRC}
          alt=""
          width={size}
          height={size}
          className="sage-avatar__img"
          decoding="async"
          draggable={false}
        />
      </span>
    </span>
  );
}
