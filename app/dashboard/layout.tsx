import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";
import { getSession } from "@/lib/auth/session";
import type { ProjectAccessSummary, ProjectSummary } from "@/lib/projects/api";
import { getCurrentProjectFromRequest } from "@/lib/projects/current-project";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  const res = await fetch(`${apiUrl}/api/v1/admin/projects`, {
    headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
    cache: "no-store",
  });
  const data = res.ok
    ? ((await res.json()) as { projects?: ProjectSummary[] })
    : { projects: [] };
  const projects = data.projects ?? [];
  const activeProjects = projects.filter(
    (project) => project.status === "active",
  );
  const currentProject = await getCurrentProjectFromRequest(activeProjects);

  let currentAccess: ProjectAccessSummary | null = null;
  if (currentProject) {
    const accessRes = await fetch(
      `${apiUrl}/api/v1/admin/projects/${currentProject.slug}/access`,
      {
        headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
        cache: "no-store",
      },
    );
    if (accessRes.ok) {
      const accessData = (await accessRes.json()) as {
        access?: ProjectAccessSummary;
      };
      currentAccess = accessData.access ?? null;
    }
  }

  return (
    <AdminDashboardShell
      userEmail={session.user.email}
      isAdmin={session.user.isAdmin}
      projects={activeProjects}
      currentProject={currentProject}
      currentAccess={currentAccess}
    >
      {children}
    </AdminDashboardShell>
  );
}
