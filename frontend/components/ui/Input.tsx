"use client";

import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  inputClassName = "",
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={`cs-field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="cs-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "cs-input",
          "cs-focus-ring",
          rest.type === "search" ? "cs-input--search" : "",
          error ? "border-[var(--critical)]" : "",
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[10px] text-[var(--text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="cs-alert cs-alert--error mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
