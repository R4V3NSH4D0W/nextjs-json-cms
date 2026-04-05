import { redirect } from "next/navigation";

import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <AdminDashboardShell userEmail={session.user.email}>
      {children}
    </AdminDashboardShell>
  );
}
