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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useCurrentUser } from "@/components/providers/current-user-provider";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { currentProject } = useCurrentProject();
  const { isAdmin } = useCurrentUser();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const createProject = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        slug: slug || undefined,
        description: description || undefined,
        allowedOrigins: ["http://localhost:3000"],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setSlug("");
      setDescription("");
      toast.success("Project created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Projects
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAdmin ? "Manage projects" : "Your projects"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Every project keeps its own layouts, pages, site chrome, media scope, allowed origins, and API tokens."
            : "These are the projects your account can access. Ask an admin to grant access to more projects."}
        </p>
      </header>

      <div
        className={
          isAdmin ? "grid gap-6 lg:grid-cols-[1.2fr,0.8fr]" : "grid gap-6"
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {isAdmin ? "Existing projects" : "Accessible projects"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{project.name}</p>
                    {currentProject?.slug === project.slug ? (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {project.slug}
                  </p>
                  {project.description ? (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/projects/select?slug=${encodeURIComponent(project.slug)}&redirect=/dashboard`}
                    >
                      Open
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.slug}`}>
                      Settings
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Create project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Slug (optional)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <Textarea
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                onClick={() => createProject.mutate()}
                disabled={!name.trim() || createProject.isPending}
              >
                Create project
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
