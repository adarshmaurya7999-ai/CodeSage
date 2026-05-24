"use client";

import { useState } from "react";

const tabs = ["Conversation", "Files", "Commits", "Checks"];

export function MainTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState("Files");

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      <div className="flex gap-8 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`relative pb-3 text-[13px] transition ${
              active === tab
                ? "font-semibold text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab}
            {active === tab && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--accent-blue)]"
                style={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)" }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto py-3">{children}</div>
    </div>
  );
}
