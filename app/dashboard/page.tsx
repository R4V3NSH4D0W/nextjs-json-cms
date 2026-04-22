import Link from "next/link";
import { cookies } from "next/headers";
import {
  FileText,
  LayoutTemplate,
  Plus,
  Settings,
  Globe,
  Activity,
} from "lucide-react";

import type { ProjectSummary } from "@/lib/projects/api";
import { getCurrentProjectFromRequest } from "@/lib/projects/current-project";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function fetchCount(path: string, cookieHeader: string): Promise<number> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as {
      pages?: unknown[];
      layouts?: unknown[];
    };
    return (data.pages ?? data.layouts ?? []).length;
  } catch {
    return 0;
  }
}

export default async function DashboardHomePage() {
  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  const cookieHeader = token ? `${sessionCookie}=${token}` : "";
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

  const projectsRes = await fetch(`${apiUrl}/api/v1/admin/projects`, {
    headers: token ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  const projectsData = projectsRes.ok
    ? ((await projectsRes.json()) as { projects?: ProjectSummary[] })
    : { projects: [] };

  const projects = projectsData.projects ?? [];
  const activeProjects = projects.filter(
    (project) => project.status === "active",
  );
  const currentProject = await getCurrentProjectFromRequest(projects);

  if (!currentProject) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Globe className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Select a Project
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You need to select a project workspace to manage content, media, and
            settings.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mt-4">
          {activeProjects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/select?slug=${encodeURIComponent(p.slug)}&redirect=/dashboard`}
              className="flex flex-col items-start p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Launch Workspace
              </span>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {p.description || "Project instance"}
              </p>
            </Link>
          ))}
          {activeProjects.length === 0 && (
            <div className="col-span-full py-12 text-muted-foreground">
              No active projects found. Contact an administrator to be added to
              an active project.
            </div>
          )}
        </div>
      </div>
    );
  }

  const [cmsPageCount, cmsLayoutCount] = await Promise.all([
    fetchCount(
      `/api/v1/admin/projects/${currentProject.slug}/cms/pages`,
      cookieHeader,
    ),
    fetchCount(
      `/api/v1/admin/projects/${currentProject.slug}/cms/layouts`,
      cookieHeader,
    ),
  ]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-semibold px-3 py-1"
          >
            Project Workspace
          </Badge>
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            Active:{" "}
            <code className="bg-muted px-1 rounded">{currentProject.slug}</code>
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground/90">
          {currentProject.name}
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Manage your project&apos;s digital presence, layouts, and public
          content API. Everything modified here is isolated to the{" "}
          <strong>{currentProject.name}</strong> environment.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Metrics
              </span>
            </div>
            <CardTitle className="text-2xl pt-2">Content Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-4 border border-border/30">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                    Active Pages
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {cmsPageCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-4 border border-border/30">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <LayoutTemplate className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                    UI Layouts
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {cmsLayoutCount}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/20 text-[10px] flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Settings className="size-3" /> Status:{" "}
              {currentProject.status || "Active"}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              API Base:{" "}
              <code className="bg-muted px-1 rounded">
                /api/v1/projects/{currentProject.slug}
              </code>
            </span>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Actions</CardTitle>
            <CardDescription>Quick access to common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              asChild
              className="w-full justify-start gap-2 h-10 shadow-sm"
            >
              <Link href="/dashboard/cms/pages/new">
                <Plus className="size-4" /> Create New Page
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2 h-10"
            >
              <Link href="/dashboard/settings">
                <Settings className="size-4" /> Workspace Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/50 bg-card/60">
          <CardHeader className="pb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Digital Assets
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-9 px-4 gap-2"
            >
              <Link href="/dashboard/media">
                <Plus className="size-3.5" /> Media Gallery
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-9 px-4 gap-2"
            >
              <Link href="/dashboard/cms/pages">
                <FileText className="size-3.5" /> All Pages
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-card/60">
          <CardHeader className="pb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Information
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              Modifications made in this workspace are instantly available to
              the public content API under the project slug{" "}
              <strong>{currentProject.slug}</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
