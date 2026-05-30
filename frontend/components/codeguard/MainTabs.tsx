"use client";

export function MainTabs({ children }: { children: React.ReactNode }) {
  return <div className="main-tabs flex min-h-0 flex-1 flex-col overflow-hidden pt-1">{children}</div>;
}
