"use client";

import { PRDataProvider } from "@/hooks/usePRData";
import { CodeDiffViewer } from "./CodeDiffViewer";
import { FindingsDock } from "./FindingsDock";
import { JarvisBackground } from "./JarvisBackground";
import { MainTabs } from "./MainTabs";
import { ReviewProvider } from "./ReviewContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Dashboard() {
  return (
    <PRDataProvider>
      <ReviewProvider>
        <div className="app-shell relative flex h-screen overflow-hidden">
          <JarvisBackground />

          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
            <TopBar />

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <Sidebar />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <main className="main-content-area flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-1">
                  <MainTabs>
                    <CodeDiffViewer />
                  </MainTabs>
                </main>

                <FindingsDock />
              </div>
            </div>
          </div>
        </div>
      </ReviewProvider>
    </PRDataProvider>
  );
}
