"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type DashboardView = "pr-review" | "team-analytics";
export type NavItemId = "team-analytics" | "pull-requests" | "findings";

interface DashboardViewContextValue {
  view: DashboardView;
  activeNav: NavItemId;
  setView: (view: DashboardView) => void;
  setActiveNav: (nav: NavItemId) => void;
  openTeamAnalytics: () => void;
  openPrReview: () => void;
}

const DashboardViewContext = createContext<DashboardViewContextValue | null>(null);

export function DashboardViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<DashboardView>("pr-review");
  const [activeNav, setActiveNav] = useState<NavItemId>("pull-requests");

  const value = useMemo(
    () => ({
      view,
      activeNav,
      setView,
      setActiveNav,
      openTeamAnalytics: () => {
        setView("team-analytics");
        setActiveNav("team-analytics");
      },
      openPrReview: () => {
        setView("pr-review");
        setActiveNav("pull-requests");
      },
    }),
    [view, activeNav],
  );

  return (
    <DashboardViewContext.Provider value={value}>{children}</DashboardViewContext.Provider>
  );
}

export function useDashboardView(): DashboardViewContextValue {
  const ctx = useContext(DashboardViewContext);
  if (!ctx) {
    throw new Error("useDashboardView must be used within DashboardViewProvider");
  }
  return ctx;
}
