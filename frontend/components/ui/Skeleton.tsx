export interface SkeletonProps {
  className?: string;
  lines?: number;
  row?: boolean;
}

export function Skeleton({ className = "", lines = 2, row = true }: SkeletonProps) {
  if (row) {
    return (
      <div
        className={`cs-skeleton-row ${className}`}
        aria-hidden
      >
        <div className={`cs-skeleton h-3 ${lines > 1 ? "w-1/2" : "w-full"}`} />
        {lines > 1 && <div className="cs-skeleton mt-2 h-2 w-1/3" />}
      </div>
    );
  }

  return <div className={`cs-skeleton ${className}`} aria-hidden />;
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
