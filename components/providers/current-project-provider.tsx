"use client";

import { createContext, useContext } from "react";
import type {
  ProjectAccessSummary,
  ProjectSummary,
} from "@/lib/projects/api";

type CurrentProjectContextValue = {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  currentAccess: ProjectAccessSummary | null;
};

const CurrentProjectContext = createContext<CurrentProjectContextValue>({
  projects: [],
  currentProject: null,
  currentAccess: null,
});

export function CurrentProjectProvider({
  projects,
  currentProject,
  currentAccess,
  children,
}: {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  currentAccess: ProjectAccessSummary | null;
  children: React.ReactNode;
}) {
  return (
    <CurrentProjectContext.Provider
      value={{ projects, currentProject, currentAccess }}
    >
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  return useContext(CurrentProjectContext);
}
