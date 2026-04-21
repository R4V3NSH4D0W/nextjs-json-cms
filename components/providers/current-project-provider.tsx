"use client";

import { createContext, useContext } from "react";
import type {
  FeatureKey,
  ProjectAccessSummary,
  ProjectSummary,
} from "@/lib/projects/api";

type CurrentProjectContextValue = {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  currentAccess: ProjectAccessSummary | null;
  hasService: (serviceKey: FeatureKey) => boolean;
};

const CurrentProjectContext = createContext<CurrentProjectContextValue>({
  projects: [],
  currentProject: null,
  currentAccess: null,
  hasService: () => false,
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
  const hasService = (serviceKey: FeatureKey) => {
    if (!currentAccess) return false;
    return currentAccess.features.includes(serviceKey);
  };

  return (
    <CurrentProjectContext.Provider
      value={{ projects, currentProject, currentAccess, hasService }}
    >
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  return useContext(CurrentProjectContext);
}
