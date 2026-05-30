"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { JarvisBackground } from "./JarvisBackground";

export function DashboardShell({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pointer-x", `${x}%`);
    el.style.setProperty("--pointer-y", `${y}%`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    shellRef.current?.style.setProperty("--pointer-x", "50%");
    shellRef.current?.style.setProperty("--pointer-y", "40%");
  }, []);

  return (
    <div
      ref={shellRef}
      className="app-shell dashboard-shell relative flex h-screen overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <JarvisBackground />
      {children}
    </div>
  );
}
