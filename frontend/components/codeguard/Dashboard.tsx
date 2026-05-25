"use client";

import { PRDataProvider } from "@/hooks/usePRData";
import { CodeDiffViewer } from "./CodeDiffViewer";
import { DashboardViewProvider, useDashboardView } from "./DashboardViewContext";
import { FindingsDock } from "./FindingsDock";
import { JarvisBackground } from "./JarvisBackground";
import { MainTabs } from "./MainTabs";
import { ReviewProvider } from "./ReviewContext";
import { Sidebar } from "./Sidebar";
import { TeamAnalyticsView } from "./TeamAnalyticsView";
import { TopBar } from "./TopBar";

function DashboardBody() {
  const { view } = useDashboardView();
  const isAnalytics = view === "team-analytics";

  return (
    <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!isAnalytics && <Sidebar />}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isAnalytics ? (
            <main className="main-content-area flex min-h-0 flex-1 flex-col overflow-hidden">
              <TeamAnalyticsView />
            </main>
          ) : (
            <>
              <main className="main-content-area flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-1">
                <MainTabs>
                  <CodeDiffViewer />
                </MainTabs>
              </main>
              <FindingsDock />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <PRDataProvider>
      <ReviewProvider>
        <DashboardViewProvider>
          <div className="app-shell relative flex h-screen overflow-hidden">
            <JarvisBackground />
            <DashboardBody />
          </div>
        </DashboardViewProvider>
      </ReviewProvider>
    </PRDataProvider>
  );
}
