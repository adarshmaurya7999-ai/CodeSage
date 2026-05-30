export interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

export function Spinner({
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`cs-spinner cs-spinner--${size} ${className}`.trim()}
    />
  );
}
