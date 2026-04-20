"use client";

import { createContext, useContext } from "react";
import type { ProjectSummary } from "@/lib/projects/api";

type CurrentProjectContextValue = {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
};

const CurrentProjectContext = createContext<CurrentProjectContextValue>({
  projects: [],
  currentProject: null,
});

export function CurrentProjectProvider({
  projects,
  currentProject,
  children,
}: CurrentProjectContextValue & { children: React.ReactNode }) {
  return (
    <CurrentProjectContext.Provider value={{ projects, currentProject }}>
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  return useContext(CurrentProjectContext);
}
