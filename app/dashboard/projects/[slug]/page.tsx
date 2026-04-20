"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProjectSettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const queryClient = useQueryClient();
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [fields, setFields] = useState({
    name: "",
    description: "",
    primaryDomain: "",
    allowedOrigins: "",
  });

  const slug = params.slug;

  const projectQuery = useQuery({
    queryKey: ["project", slug],
    queryFn: () => projectsApi.get(slug),
    enabled: !!slug,
  });

  const tokensQuery = useQuery({
    queryKey: ["project-tokens", slug],
    queryFn: () => projectsApi.listTokens(slug),
    enabled: !!slug,
  });

  const project = projectQuery.data?.project;

  useEffect(() => {
    if (!project) return;
    setFields({
      name: project.name,
      description: project.description ?? "",
      primaryDomain: project.primaryDomain ?? "",
      allowedOrigins: project.allowedOrigins.join("\n"),
    });
  }, [project]);

  const updateProject = useMutation({
    mutationFn: () =>
      projectsApi.update(slug, {
        name: fields.name,
        description: fields.description || null,
        primaryDomain: fields.primaryDomain || null,
        allowedOrigins: fields.allowedOrigins
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", slug] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createToken = useMutation({
    mutationFn: () => projectsApi.createToken(slug, { label: newTokenLabel }),
    onSuccess: async (data) => {
      setPlainToken(data.token);
      setNewTokenLabel("");
      await queryClient.invalidateQueries({ queryKey: ["project-tokens", slug] });
      toast.success("Token created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeToken = useMutation({
    mutationFn: (tokenId: string) => projectsApi.revokeToken(slug, tokenId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-tokens", slug] });
      toast.success("Token revoked");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
        <Link href="/dashboard/projects">← Projects</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Project name"
              value={fields.name}
              onChange={(e) => setFields((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Textarea
              placeholder="Description"
              value={fields.description}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Input
              placeholder="Primary domain"
              value={fields.primaryDomain}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, primaryDomain: e.target.value }))
              }
            />
            <Textarea
              placeholder="Allowed origins, one per line"
              value={fields.allowedOrigins}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, allowedOrigins: e.target.value }))
              }
              rows={6}
            />
            <Button onClick={() => updateProject.mutate()} disabled={updateProject.isPending}>
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="New token label"
              value={newTokenLabel}
              onChange={(e) => setNewTokenLabel(e.target.value)}
            />
            <Button
              onClick={() => createToken.mutate()}
              disabled={!newTokenLabel.trim() || createToken.isPending}
            >
              Create token
            </Button>
            {plainToken ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                Copy this token now. It will only be shown once.
                <div className="mt-2 break-all font-mono text-xs">{plainToken}</div>
              </div>
            ) : null}
            <div className="space-y-3">
              {(tokensQuery.data?.tokens ?? []).map((token) => (
                <div key={token.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{token.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(token.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeToken.mutate(token.id)}
                      disabled={!token.active || revokeToken.isPending}
                    >
                      {token.active ? "Revoke" : "Revoked"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
