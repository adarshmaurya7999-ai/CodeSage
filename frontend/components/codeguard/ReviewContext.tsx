"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ReviewContextValue {
  highlightedLine: number | null;
  setHighlightedLine: (line: number | null) => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  return (
    <ReviewContext.Provider value={{ highlightedLine, setHighlightedLine }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview(): ReviewContextValue {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReview must be used within ReviewProvider");
  }
  return ctx;
}
