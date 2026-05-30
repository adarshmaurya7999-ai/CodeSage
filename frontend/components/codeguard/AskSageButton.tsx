"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSageUiThinking } from "@/lib/sage-ui-store";
import { SageAvatar } from "./SageAvatar";
import "./ask-sage.css";

export interface AskSageButtonProps {
  onClick: () => void;
  className?: string;
  bubbleText?: string;
  /** Override store (e.g. tests); defaults to mirrored `isSending` */
  isThinking?: boolean;
}

export function AskSageButton({
  onClick,
  className = "",
  bubbleText = "Here's my take…",
  isThinking: isThinkingProp,
}: AskSageButtonProps) {
  const isThinkingFromStore = useSageUiThinking();
  const isThinking = isThinkingProp ?? isThinkingFromStore;

  const [isInteract, setIsInteract] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const wasThinkingRef = useRef(false);

  useEffect(() => {
    const wasThinking = wasThinkingRef.current;
    wasThinkingRef.current = isThinking;
    if (wasThinking && !isThinking) {
      setIsResponding(true);
      const t = window.setTimeout(() => setIsResponding(false), 2800);
      return () => window.clearTimeout(t);
    }
  }, [isThinking]);

  const handleClick = useCallback(() => {
    setIsInteract(true);
    window.setTimeout(() => setIsInteract(false), 280);
    onClick();
  }, [onClick]);

  const bubbleVisible = isThinking || isResponding;
  const bubbleCopy = isThinking ? "Thinking…" : isResponding ? bubbleText : "";

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsInteract(true)}
      onMouseLeave={() => !isThinking && setIsInteract(false)}
      onFocus={() => setIsInteract(true)}
      onBlur={() => !isThinking && setIsInteract(false)}
      className={`ask-sage nav-pop ${className}`.trim()}
      aria-label="Ask Sage — open conversation"
    >
      <span
        className={`ask-sage__bubble ${bubbleVisible ? "ask-sage__bubble--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {bubbleCopy}
      </span>

      <SageAvatar
        isThinking={isThinking}
        isResponding={isResponding}
        isInteract={isInteract}
        size={36}
      />

      <span className="ask-sage__label">
        Ask <span className="ask-sage__label-sage">Sage</span>
      </span>
    </button>
  );
}
