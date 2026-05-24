"use client";

import { AIFindingsPanel } from "./AIFindingsPanel";
import { CodeDiffViewer } from "./CodeDiffViewer";
import { JarvisBackground } from "./JarvisBackground";
import { MainTabs } from "./MainTabs";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Dashboard() {
  return (
    <div className="app-shell relative flex h-screen overflow-hidden">
      <JarvisBackground />

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
        <Sidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <main className="main-content-area flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 pb-4">
              <MainTabs>
                <CodeDiffViewer />
                <AIFindingsPanel />
              </MainTabs>
            </main>

            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
