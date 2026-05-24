"use client";

import { useState } from "react";
import { navItems, sidebarStats } from "@/lib/mock-data";
import { NavIcon, ShieldIcon } from "./icons";

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={`sidebar-panel ${expanded ? "sidebar-panel--expanded" : ""}`}
      >
        <div className="sidebar-panel-inner flex h-full flex-col">
          <button
            type="button"
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-[var(--bg-elevated)] ${
              expanded ? "w-full justify-start" : "mx-auto justify-center"
            }`}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--accent-violet)]"
              style={{ boxShadow: "0 0 16px rgba(139, 92, 246, 0.3)" }}
            >
              <ShieldIcon className="h-5 w-5" />
            </span>
            {expanded && (
              <span className="sidebar-label font-[family-name:var(--font-jetbrains)] text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
                CodeSage AI
              </span>
            )}
          </button>

          <nav
            className={`mt-3 flex flex-1 flex-col gap-0.5 ${expanded ? "px-1" : "items-center"}`}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                className={`relative flex items-center rounded-lg transition-all duration-150 ${
                  expanded ? "w-full gap-2.5 px-3 py-2.5 text-left" : "h-10 w-10 justify-center"
                } ${
                  item.active
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {item.active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--accent-violet)] shadow-[0_0_8px_var(--accent-violet)]" />
                )}
                <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                {expanded && (
                  <span className="sidebar-label text-[13px] font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {expanded && (
            <div className="sidebar-label mb-2 grid grid-cols-2 gap-1.5 border-t border-[var(--border)] pt-3">
              {sidebarStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded border border-[var(--border)] bg-[var(--bg-primary)]/60 p-2"
                >
                  <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
                  <p className="font-[family-name:var(--font-jetbrains)] text-[13px] font-semibold text-[var(--text-primary)]">
                    {stat.value}
                  </p>
                  <span className="text-[9px] font-medium text-[var(--success)]">{stat.delta}</span>
                </div>
              ))}
            </div>
          )}

          <div
            className={`mt-auto flex items-center gap-2 pb-1 ${expanded ? "px-1" : "justify-center"}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] font-[family-name:var(--font-jetbrains)] text-[11px] font-bold text-[var(--text-muted)]">
              N
            </div>
            {expanded && (
              <span className="sidebar-label truncate text-[11px] text-[var(--text-muted)]">
                vivek@acme
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
