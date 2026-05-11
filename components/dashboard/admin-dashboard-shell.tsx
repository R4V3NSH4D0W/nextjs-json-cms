"use client";

import { CurrentProjectProvider } from "@/components/providers/current-project-provider";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import type { ProjectAccessSummary, ProjectSummary } from "@/lib/projects/api";

import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminDashboardShell({
  userEmail,
  isAdmin,
  projects,
  currentProject,
  currentAccess,
  mode = "dashboard",
  children,
}: {
  userEmail: string;
  isAdmin: boolean;
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  currentAccess: ProjectAccessSummary | null;
  mode?: "admin" | "dashboard";
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <CurrentUserProvider isAdmin={isAdmin}>
        <CurrentProjectProvider
          projects={projects}
          currentProject={currentProject}
          currentAccess={currentAccess}
        >
          <SidebarProvider defaultOpen className="h-screen overflow-hidden">
            <Toaster />
            <div className="flex h-full w-full overflow-x-hidden overflow-y-hidden bg-background">
              <AdminSidebar mode={mode} />
              <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
                <AdminHeader userEmail={userEmail} mode={mode} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-background/80 px-3 py-4 md:px-4 md:py-5 lg:px-5 lg:py-6">
                  <div className="mx-auto w-full min-w-0 max-w-none">{children}</div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </CurrentProjectProvider>
      </CurrentUserProvider>
    </QueryProvider>
  );
}
