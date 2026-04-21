import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";
import { getSession } from "@/lib/auth/session";
import type { ProjectSummary } from "@/lib/projects/api";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!session.user.isAdmin) {
    // Non-admins are redirected back to the project dashboard
    redirect("/dashboard");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  
  // Admins need the project list for the global projects view and quick switcher
  const res = await fetch(`${apiUrl}/api/v1/admin/projects`, {
    headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
    cache: "no-store",
  });
  
  const data = res.ok
    ? ((await res.json()) as { projects?: ProjectSummary[] })
    : { projects: [] };
  
  const projects = data.projects ?? [];

  return (
    <AdminDashboardShell
      userEmail={session.user.email}
      isAdmin={session.user.isAdmin}
      projects={projects}
      currentProject={null} // No project context in platform mode
      currentAccess={null}
      mode="admin"
    >
      {children}
    </AdminDashboardShell>
  );
}
