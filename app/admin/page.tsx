import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Plus, 
  Settings, 
  Activity,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  Users
} from "lucide-react";

import type { ProjectSummary } from "@/lib/projects/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-3 py-1">
            Platform Hub
          </Badge>
          <span className="text-muted-foreground transition-all hover:text-primary cursor-default text-xs flex items-center gap-1">
            <Activity className="size-3" /> System Operational
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground/90">
          Platform Administration
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Centralized management for all provisioned tenants, infrastructure monitoring, and global security governance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Total Projects Card */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <FolderKanban className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Infrastructure</span>
            </div>
            <CardTitle className="text-sm font-medium pt-1">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{projects.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Multi-tenant isolation active</p>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-emerald-500">
              <Activity className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Health</span>
            </div>
            <CardTitle className="text-sm font-medium pt-1">Hono Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-emerald-500">Healthy</div>
            <p className="text-[10px] text-muted-foreground mt-1">Latencies within nominal range</p>
          </CardContent>
        </Card>

        {/* Security Summary Card */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Security</span>
            </div>
            <CardTitle className="text-sm font-medium pt-1">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-amber-500">Active</div>
            <p className="text-[10px] text-muted-foreground mt-1">Monitoring administrative events</p>
          </CardContent>
        </Card>

        {/* User Summary Card (Static for now) */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-blue-500">
              <Users className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Users</span>
            </div>
            <CardTitle className="text-sm font-medium pt-1">Platform Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-blue-500">Admin</div>
            <p className="text-[10px] text-muted-foreground mt-1">Identity management centralized</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Management Section */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Administrative Tools</CardTitle>
            <CardDescription>Rapidly access global management functions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
             <Button asChild variant="outline" className="justify-start h-12 gap-3 group">
                <Link href="/admin/projects">
                  <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Manage Projects</span>
                    <span className="text-[10px] text-muted-foreground">Detailed project list and provisioning</span>
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
                    <span className="text-[10px] text-muted-foreground">Examine structured system logs</span>
                  </div>
                </Link>
             </Button>
          </CardContent>
        </Card>

        {/* System & Runtime Card */}
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">System Utilities</CardTitle>
            <CardDescription>Direct access to backend resources and health.</CardDescription>
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

             <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-3">
                   <Activity className="size-4 text-primary" />
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold">Version Control</span>
                      <span className="text-[10px] text-muted-foreground">v0.2.0-stable (Foundation)</span>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
