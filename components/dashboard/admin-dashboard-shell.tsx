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
          <SidebarProvider defaultOpen>
            <Toaster />
            <div className="flex min-h-screen w-full bg-background">
              <AdminSidebar mode={mode} />
              <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader userEmail={userEmail} mode={mode} />
                <main className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6 lg:p-8 dark:bg-muted/25">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </CurrentProjectProvider>
      </CurrentUserProvider>
    </QueryProvider>
  );
}
