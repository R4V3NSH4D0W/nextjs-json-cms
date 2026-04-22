"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@/lib/shared/react-query";
import { type ServiceKey, projectsApi } from "@/lib/projects/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  LayoutGrid,
  Activity,
  Users,
  Settings2,
  Clock,
  ChevronRight,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { ProvisionProjectSheet } from "@/components/dashboard/admin/provision-project-sheet";
import { cn } from "@/lib/shared/utils";

export default function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("all");
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
  const [approveSelectionByRequest, setApproveSelectionByRequest] = useState<
    Record<string, ServiceKey[]>
  >({});

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const pendingRequests = useQuery({
    queryKey: ["access-requests", "pending"],
    queryFn: () => projectsApi.listPendingAccessRequests(),
    enabled: isAdmin,
  });

  const reviewRequest = useMutation({
    mutationFn: ({
      requestId,
      decision,
      approvedServiceKeys,
    }: {
      requestId: string;
      decision: "approve" | "deny";
      approvedServiceKeys?: ServiceKey[];
    }) =>
      projectsApi.reviewAccessRequest(requestId, {
        decision,
        approvedServiceKeys,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["access-requests", "pending"],
      });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Access request updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveProject = useMutation({
    mutationFn: async (projectSlug: string) => {
      setArchivingProjectSlug(projectSlug);
      return projectsApi.deleteProject(projectSlug);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({
        queryKey: ["access-requests", "pending"],
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["access-requests", "pending"],
      });
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

  // Stats calculation
  const stats = useMemo(() => {
    const total = allProjects.length;
    const active = allProjects.filter((p) => p.status === "active").length;
    const pending = pendingRequests.data?.requests?.length ?? 0;

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
        label: "Security Gates",
        value: pending,
        icon: ShieldCheck,
        color: "text-amber-500",
      },
      {
        label: "Provisioned Users",
        value: "Unified",
        icon: Users,
        color: "text-blue-500",
      },
    ];
  }, [allProjects, pendingRequests.data?.requests?.length]);

  function toggleApproveService(requestId: string, serviceKey: ServiceKey) {
    setApproveSelectionByRequest((prev) => {
      const current = prev[requestId] ?? [];
      const next = current.includes(serviceKey)
        ? current.filter((key) => key !== serviceKey)
        : [...current, serviceKey];
      return { ...prev, [requestId]: next };
    });
  }

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

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-semibold h-6 px-2"
          >
            Infrastructure Dashboard
          </Badge>
          <div className="size-1 rounded-full bg-border" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Admin Domain
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">
              Project Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Orchestrate isolated tenant environments and govern cross-project
              security access.
            </p>
          </div>
          <ProvisionProjectSheet />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-primary/20 group"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-lg bg-background/80 shadow-inner group-hover:scale-110 transition-transform",
                  stat.color,
                )}
              >
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {/* Search and control bar */}
        <Tabs
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | "active" | "archived")
          }
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug or metadata..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/60 focus:bg-background transition-colors"
              />
            </div>

            <TabsList className="h-auto flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
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

            <div className="hidden items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 p-1 sm:flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 bg-background shadow-sm border border-border/50"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground opacity-50"
              >
                <Settings2 className="size-4" />
              </Button>
            </div>
          </div>

          {statusFilter === "archived" && filteredProjects.length > 0 ? (
            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
              Archived projects are read-only until restored. Use Restore
              Project on any card to reactivate it instantly.
            </div>
          ) : null}

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="h-48 animate-pulse border-border/50 bg-card/20"
                />
              ))
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-muted/20">
                <div className="size-12 rounded-full bg-background flex items-center justify-center text-muted-foreground/30 mb-4 border border-border">
                  <FolderKanban className="size-6" />
                </div>
                <h3 className="text-sm font-bold">No instances found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your platform is currently dormant. Use the &quot;Provision
                  Project&quot; button above to deploy your first tenant.
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group relative border-border/50 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-tighter",
                        project.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-12">
                        <CardTitle className="text-base font-bold truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                          <div className="size-1 rounded-full bg-primary/40" />
                          {project.slug}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 flex-1">
                    <p className="min-h-12 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.description ||
                        "No mission-specific context provided for this tenant instance."}
                    </p>
                    {project.primaryDomain && (
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-muted-foreground/80 bg-muted/30 px-2.5 py-1 rounded-md border border-border/30 w-fit">
                        <ExternalLink className="size-3" />
                        {project.primaryDomain}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 mt-auto border-t border-border/30 flex gap-2">
                    {project.status === "active" ? (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="flex-1 h-9 font-bold"
                      >
                        <Link
                          href={`/dashboard/projects/select?slug=${encodeURIComponent(project.slug)}&redirect=/dashboard`}
                        >
                          Launch Console
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 border-emerald-200/80 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100"
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
                            Project
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
                This action can be reverted by an admin using Restore. To
                prevent mistakes, confirm the project details below.
              </DialogDescription>
            </DialogHeader>

            {deleteDialogProject && (
              <div className="space-y-4">
                <div className="rounded-md border border-rose-200/70 bg-rose-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                    Project to archive
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
                    I understand this project will be archived and hidden from
                    active use until restored.
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

      {/* Access requests section */}
      {(pendingRequests.data?.requests ?? []).length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <ShieldCheck className="size-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Gateway Authorization Required
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full h-5 px-1.5 text-[10px] tabular-nums font-bold"
            >
              {(pendingRequests.data?.requests ?? []).length}
            </Badge>
          </div>

          <div className="grid gap-4">
            {pendingRequests.data?.requests?.map((req) => (
              <Card
                key={req.id}
                className="border-border/50 bg-card/30 overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20">
                  <div className="p-4 md:w-64 space-y-1 bg-muted/10">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">
                        {req.project.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono h-4"
                      >
                        {req.project.slug}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {req.user?.email}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mt-2 opacity-60">
                      <Clock className="size-3" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground mb-2 flex items-center gap-1.5">
                          Requested Permissions{" "}
                          <ChevronRight className="size-2.5" />
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {req.requestedServiceKeys.map((serviceKey) => {
                            const checked = (
                              approveSelectionByRequest[req.id] ?? []
                            ).includes(serviceKey);
                            return (
                              <button
                                key={`${req.id}-${serviceKey}`}
                                onClick={() =>
                                  toggleApproveService(req.id, serviceKey)
                                }
                                className={cn(
                                  "px-2 py-1 rounded-md border text-[9px] font-mono transition-all",
                                  checked
                                    ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-sm"
                                    : "bg-background/40 border-border/50 text-muted-foreground hover:border-border hover:bg-background/60",
                                )}
                              >
                                {serviceKey}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            reviewRequest.mutate({
                              requestId: req.id,
                              decision: "deny",
                            })
                          }
                          disabled={reviewRequest.isPending}
                          className="h-8 text-[11px] hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                        >
                          Deny Entry
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            reviewRequest.mutate({
                              requestId: req.id,
                              decision: "approve",
                              approvedServiceKeys:
                                (approveSelectionByRequest[req.id] ?? [])
                                  .length > 0
                                  ? approveSelectionByRequest[req.id]
                                  : req.requestedServiceKeys,
                            })
                          }
                          disabled={reviewRequest.isPending}
                          className="h-8 text-[11px] font-bold px-4 shadow-sm"
                        >
                          {reviewRequest.isPending
                            ? "Processing..."
                            : "Authorize Access"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
