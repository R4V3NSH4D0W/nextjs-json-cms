import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Activity,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  Users
} from "lucide-react";

import type { ProjectSummary } from "@/lib/projects/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

  const projectsRes = await fetch(`${apiUrl}/api/v1/admin/projects`, {
    headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
    cache: "no-store",
  });
  const projectsData = projectsRes.ok
    ? ((await projectsRes.json()) as { projects?: ProjectSummary[] })
    : { projects: [] };
  
  const projects = projectsData.projects ?? [];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit px-2 py-0.5 text-xs">Admin</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground/90">
          Platform Administration
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Manage projects, users, and audit activity from one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <FolderKanban className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Projects</span>
            </div>
            <CardTitle className="pt-1 text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{projects.length}</div>
            <p className="mt-1 text-[10px] text-muted-foreground">All configured workspaces</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-emerald-500">
              <Activity className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Health</span>
            </div>
            <CardTitle className="pt-1 text-sm font-medium">Backend API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums text-emerald-600">Healthy</div>
            <p className="mt-1 text-[10px] text-muted-foreground">Service is available</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Access</span>
            </div>
            <CardTitle className="pt-1 text-sm font-medium">Admin model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums text-amber-600">Role-based</div>
            <p className="mt-1 text-[10px] text-muted-foreground">Super admin and project admin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common admin tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
             <Button asChild variant="outline" className="justify-start h-12 gap-3 group">
                <Link href="/admin/projects">
                  <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Manage Projects</span>
                    <span className="text-[10px] text-muted-foreground">View, create, archive, restore</span>
                  </div>
                </Link>
             </Button>
             <Button asChild variant="outline" className="justify-start h-12 gap-3 group">
                <Link href="/admin/audit">
                  <div className="size-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">View Audit Logs</span>
                    <span className="text-[10px] text-muted-foreground">Track administrative activity</span>
                  </div>
                </Link>
             </Button>
             <Button asChild variant="outline" className="justify-start h-12 gap-3 group">
                <Link href="/admin/users">
                  <div className="size-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                    <Users className="size-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Manage Users</span>
                    <span className="text-[10px] text-muted-foreground">Create and review accounts</span>
                  </div>
                </Link>
             </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Runtime</CardTitle>
            <CardDescription>Backend endpoint and health check.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-3">
                   <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold">API Environment</span>
                      <code className="text-[10px] text-muted-foreground">{apiUrl}</code>
                   </div>
                </div>
                <Button asChild variant="link" size="sm" className="gap-1 p-0 h-auto text-xs">
                  <a href={`${apiUrl}/api/health`} target="_blank" rel="noreferrer">
                    Health Check <ExternalLink className="size-3" />
                  </a>
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
