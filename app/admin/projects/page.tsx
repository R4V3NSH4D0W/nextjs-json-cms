"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import {
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  Search,
  Activity,
  Settings2,
  Trash2,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { ProvisionProjectSheet } from "@/components/dashboard/admin/provision-project-sheet";
import { cn } from "@/lib/shared/utils";

function resolveBaseHostForSubdomain() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!apiUrl) return "localhost";
  try {
    const normalized = /^https?:\/\//i.test(apiUrl) ? apiUrl : `https://${apiUrl}`;
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    if (host === "127.0.0.1") return "localhost";
    return host || "localhost";
  } catch {
    return "localhost";
  }
}

function normalizeDomain(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function isRecentlyCreated(createdAt: string, windowHours = 48) {
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return Date.now() - createdMs <= windowHours * 60 * 60 * 1000;
}

export default function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("active");
  const [archivingProjectSlug, setArchivingProjectSlug] = useState<
    string | null
  >(null);
  const [restoringProjectSlug, setRestoringProjectSlug] = useState<
    string | null
  >(null);
  const [deleteDialogProject, setDeleteDialogProject] = useState<{
    name: string;
    slug: string;
  } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteAcknowledge, setDeleteAcknowledge] = useState(false);
  const [dismissedSubdomainWarnings, setDismissedSubdomainWarnings] = useState<
    string[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("dismissed-subdomain-warnings");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
      return [];
    } catch {
      return [];
    }
  });
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const archiveProject = useMutation({
    mutationFn: async (projectSlug: string) => {
      setArchivingProjectSlug(projectSlug);
      return projectsApi.deleteProject(projectSlug);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteDialogProject(null);
      setDeleteConfirmName("");
      setDeleteAcknowledge(false);
      toast.success("Project archived. You can restore it anytime.");
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setArchivingProjectSlug(null),
  });

  const restoreProject = useMutation({
    mutationFn: async (projectSlug: string) => {
      setRestoringProjectSlug(projectSlug);
      return projectsApi.restoreProject(projectSlug);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project restored successfully");
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setRestoringProjectSlug(null),
  });

  const allProjects = useMemo(() => data?.projects ?? [], [data?.projects]);

  const projectCounts = useMemo(() => {
    const active = allProjects.filter((p) => p.status === "active").length;
    const archived = allProjects.filter((p) => p.status === "archived").length;
    return {
      all: allProjects.length,
      active,
      archived,
    };
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? allProjects
        : allProjects.filter((p) => p.status === statusFilter);

    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [allProjects, searchQuery, statusFilter]);
  const baseHost = resolveBaseHostForSubdomain();

  // Stats calculation
  const stats = useMemo(() => {
    const total = allProjects.length;
    const active = allProjects.filter((p) => p.status === "active").length;
    const archived = allProjects.filter((p) => p.status === "archived").length;
    return [
      {
        label: "Total Projects",
        value: total,
        icon: FolderKanban,
        color: "text-primary",
      },
      {
        label: "Active Nodes",
        value: active,
        icon: Activity,
        color: "text-emerald-500",
      },
      {
        label: "Access Model",
        value: isAdmin ? "Centralized" : "Scoped",
        icon: ShieldCheck,
        color: "text-amber-500",
      },
      {
        label: "Archived",
        value: archived,
        icon: Activity,
        color: "text-muted-foreground",
      },
    ];
  }, [allProjects, isAdmin]);

  function openDeleteDialog(project: { slug: string; name: string }) {
    setDeleteDialogProject(project);
    setDeleteConfirmName("");
    setDeleteAcknowledge(false);
  }

  function handleConfirmDeleteProject() {
    if (!deleteDialogProject) return;
    if (deleteConfirmName.trim() !== deleteDialogProject.name) return;
    if (!deleteAcknowledge) return;
    archiveProject.mutate(deleteDialogProject.slug);
  }

  function dismissSubdomainWarning(projectSlug: string) {
    const next = Array.from(new Set([...dismissedSubdomainWarnings, projectSlug]));
    setDismissedSubdomainWarnings(next);
    try {
      window.localStorage.setItem(
        "dismissed-subdomain-warnings",
        JSON.stringify(next),
      );
    } catch {
      // ignore storage failures
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="rounded-xl border border-border/70 bg-card px-5 py-5 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage project workspaces, statuses, and access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-6 px-2 text-xs">
              Admin
            </Badge>
            <ProvisionProjectSheet />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/70 bg-card shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              </div>
              <div className={cn("rounded-md border bg-background p-2", stat.color)}>
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-5">
        <Tabs
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | "active" | "archived")
          }
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9"
                aria-label="Search projects"
              />
            </div>

            <TabsList className="h-auto flex-wrap gap-1 rounded-lg border border-border/60 bg-background p-1">
              <TabsTrigger value="all" className="h-8 px-3 text-xs">
                All ({projectCounts.all})
              </TabsTrigger>
              <TabsTrigger value="active" className="h-8 px-3 text-xs">
                Active ({projectCounts.active})
              </TabsTrigger>
              <TabsTrigger value="archived" className="h-8 px-3 text-xs">
                Archived ({projectCounts.archived})
              </TabsTrigger>
            </TabsList>
          </div>

          {statusFilter === "archived" && filteredProjects.length > 0 ? (
            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
              Archived projects are read-only until restored. Use Restore
              Project on any card to reactivate it instantly.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="h-48 animate-pulse border-border/60 bg-card"
                />
              ))
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-18 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground/40">
                  <FolderKanban className="size-6" />
                </div>
                <h3 className="text-sm font-semibold">No projects found</h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Create a new project to get started.
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                (() => {
                  const needsSubdomainSetup =
                    project.status === "active" &&
                    isRecentlyCreated(project.createdAt) &&
                    !dismissedSubdomainWarnings.includes(project.slug);
                  return (
                <Card
                  key={project.id}
                  className="flex h-full flex-col overflow-hidden border-border/70 bg-card shadow-none transition-colors hover:border-primary/30"
                >
               

                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-12">
                        <CardTitle className="truncate text-base font-semibold">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <div className="size-1 rounded-full bg-primary/40" />
                          {project.slug}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 flex-1">
                    <p className="min-h-12 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.description ||
                        "No description provided."}
                    </p>
                    {needsSubdomainSetup ? (
                      <div className="mt-4 rounded-md border border-rose-300/70 bg-rose-50/80 px-3 py-2 text-[11px] text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/20 dark:text-rose-300">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">Action required</p>
                          <button
                            type="button"
                            onClick={() => dismissSubdomainWarning(project.slug)}
                            className="inline-flex items-center gap-1 rounded-sm border border-rose-300/70 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                          >
                            <CheckCircle2 className="size-3" />
                            Mark checked
                          </button>
                        </div>
                        <p className="mt-1">
                          Create VPS subdomain:{" "}
                          <code className="rounded bg-rose-100 px-1 py-0.5 dark:bg-rose-900/50">
                            {`${project.slug}.${baseHost}`}
                          </code>
                        </p>
                      </div>
                    ) : null}
                    {project.primaryDomain && (
                      <div className="mt-4 flex w-fit items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                        <ExternalLink className="size-3" />
                        Domain: {normalizeDomain(project.primaryDomain)}
                      </div>
                    )}
                    <div className="mt-2 flex w-fit items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                      <ExternalLink className="size-3" />
                      Subdomain: {`${project.slug}.${baseHost}`}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 mt-auto border-t border-border/30 flex gap-2">
                    {project.status === "active" ? (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="h-9 flex-1 font-medium"
                      >
                        <Link
                          href={`/dashboard/projects/select?slug=${encodeURIComponent(project.slug)}&redirect=/dashboard`}
                        >
                          Open dashboard
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 border-emerald-200/80 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100"
                        onClick={() => restoreProject.mutate(project.slug)}
                        disabled={
                          restoreProject.isPending || archiveProject.isPending
                        }
                      >
                        {restoreProject.isPending &&
                        restoringProjectSlug === project.slug ? (
                          "Restoring..."
                        ) : (
                          <>
                            <RotateCcw className="mr-1 size-3.5" /> Restore
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      asChild={project.status === "active"}
                      className="size-9 h-9 border-border/50 hover:bg-background transition-colors"
                      disabled={project.status !== "active"}
                      aria-label={`Open settings for ${project.name}`}
                    >
                      {project.status === "active" ? (
                        <Link href={`/dashboard/projects/${project.slug}`}>
                          <Settings2 className="size-3.5" />
                        </Link>
                      ) : (
                        <span>
                          <Settings2 className="size-3.5" />
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 h-9 border-rose-200/70 text-rose-600 hover:bg-rose-50/80 hover:text-rose-700"
                      onClick={() => openDeleteDialog(project)}
                      disabled={
                        archiveProject.isPending ||
                        restoreProject.isPending ||
                        project.status === "archived"
                      }
                      aria-label={`Delete ${project.name}`}
                    >
                      {archiveProject.isPending &&
                      archivingProjectSlug === project.slug ? (
                        <span className="text-[10px] font-bold">...</span>
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                  );
                })()
              ))
            )}
          </div>
        </Tabs>

        <Dialog
          open={!!deleteDialogProject}
          onOpenChange={(open) => {
            if (!open && !archiveProject.isPending) {
              setDeleteDialogProject(null);
              setDeleteConfirmName("");
              setDeleteAcknowledge(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Archive Project</DialogTitle>
              <DialogDescription>
                You can restore this project later from the archived list.
              </DialogDescription>
            </DialogHeader>

            {deleteDialogProject && (
              <div className="space-y-4">
                <div className="rounded-md border border-rose-200/70 bg-rose-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                    Project
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {deleteDialogProject.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deleteDialogProject.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Type{" "}
                    <span className="font-semibold text-foreground">
                      {deleteDialogProject.name}
                    </span>{" "}
                    to confirm.
                  </p>
                  <Input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter exact project name"
                    className="border-border/60"
                    autoFocus
                  />
                </div>

                <label className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
                  <Checkbox
                    checked={deleteAcknowledge}
                    onCheckedChange={(checked) =>
                      setDeleteAcknowledge(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    I understand this project will be moved to archived status.
                  </span>
                </label>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={archiveProject.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="outline"
                className="border-rose-300/80 text-rose-700 hover:bg-rose-50"
                onClick={handleConfirmDeleteProject}
                disabled={
                  !deleteDialogProject ||
                  !deleteAcknowledge ||
                  deleteConfirmName.trim() !== deleteDialogProject.name ||
                  archiveProject.isPending
                }
              >
                {archiveProject.isPending ? "Archiving..." : "Archive Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
