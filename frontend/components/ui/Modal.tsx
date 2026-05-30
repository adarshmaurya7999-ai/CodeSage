"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  /** Initial focus target inside dialog; defaults to dialog panel */
  initialFocus?: "dialog" | "first-focusable";
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  initialFocus = "dialog",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      if (initialFocus === "first-focusable") {
        const focusable = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        focusable?.focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose, initialFocus]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="cs-modal-root">
      <button
        type="button"
        className="cs-modal-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`cs-modal cs-modal--${size} cs-focus-ring`}
      >
        <header className="cs-modal__header">
          <div className="min-w-0">
            <h2 id={titleId} className="cs-modal__title">
              {title}
            </h2>
            {subtitle && <p className="cs-modal__subtitle">{subtitle}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0 !px-2"
          >
            ✕
          </Button>
        </header>
        <div className="cs-modal__body scroll-thin">{children}</div>
        {footer && <footer className="cs-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
