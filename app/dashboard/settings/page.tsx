"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import {
  ProjectGovernanceCard,
  ProjectProfileCard,
  ProjectSettingsHero,
} from "@/components/dashboard/projects/project-settings-sections";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { Globe } from "lucide-react";

export default function WorkspaceSettingsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useCurrentUser();
  const { currentProject, currentAccess } = useCurrentProject();
  
  const slug = currentProject?.slug ?? "";
  const canManageProject = isAdmin || currentAccess?.canManageProject === true;

  const [memberUserId, setMemberUserId] = useState("");
  const [handoverEmail, setHandoverEmail] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [fieldOverrides, setFieldOverrides] = useState<
    Partial<{
      name: string;
      description: string;
      primaryDomain: string;
      allowedOrigins: string;
    }>
  >({});

  const projectQuery = useQuery({
    queryKey: ["project", slug],
    queryFn: () => projectsApi.get(slug),
    enabled: !!slug,
  });

  const membersQuery = useQuery({
    queryKey: ["project-members", slug],
    queryFn: () => projectsApi.listMembers(slug),
    enabled: !!slug && canManageProject,
  });

  const usersQuery = useQuery({
    queryKey: ["project-users", slug],
    queryFn: () => projectsApi.listProjectUsers(slug),
    enabled: !!slug && canManageProject,
  });

  const project = projectQuery.data?.project;
  const projectName = project?.name ?? "Project";
  const memberRole = currentAccess?.memberRole ?? null;

  const baseFields = useMemo(
    () => ({
      name: project?.name ?? "",
      description: project?.description ?? "",
      primaryDomain: project?.primaryDomain ?? "",
      allowedOrigins: (project?.allowedOrigins ?? []).join("\n"),
    }),
    [project],
  );

  const fields = useMemo(() => {
    return { ...baseFields, ...fieldOverrides };
  }, [baseFields, fieldOverrides]);

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
      setFieldOverrides({});
      await queryClient.invalidateQueries({ queryKey: ["project", slug] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addMember = useMutation({
    mutationFn: () => projectsApi.addMember(slug, { userId: memberUserId }),
    onSuccess: async () => {
      setMemberUserId("");
      await queryClient.invalidateQueries({
        queryKey: ["project-members", slug],
      });
      await queryClient.invalidateQueries({
        queryKey: ["project-users", slug],
      });
      toast.success("Member added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createUser = useMutation({
    mutationFn: () =>
      projectsApi.createUser({
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword,
      }),
    onSuccess: async () => {
      setNewUserEmail("");
      setNewUserPassword("");
      await queryClient.invalidateQueries({
        queryKey: ["project-users", slug],
      });
      toast.success("User created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(slug, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", slug],
      });
      toast.success("Member removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handoverProject = useMutation({
    mutationFn: () =>
      projectsApi.handoverProject(slug, { email: handoverEmail.trim() }),
    onSuccess: async () => {
      setHandoverEmail("");
      await queryClient.invalidateQueries({
        queryKey: ["project-members", slug],
      });
      await queryClient.invalidateQueries({ queryKey: ["project", slug] });
      toast.success("Project handed over to manager");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!slug) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Globe className="size-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold">No Project Context</h2>
        <p className="text-sm text-muted-foreground">Select a project to access its settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ProjectSettingsHero
        projectName={projectName}
        projectSlug={slug}
        isAdmin={isAdmin}
        canManageProject={canManageProject}
        memberRole={memberRole}
      />

      <ProjectProfileCard
        fields={fields}
        onFieldChange={(key, value) => {
          if (!canManageProject) return;
          setFieldOverrides((prev) => ({
            ...prev,
            [key]: value,
          }));
        }}
        onSave={() => {
          if (!canManageProject) {
            toast.error("You have read-only access for this project.");
            return;
          }
          updateProject.mutate();
        }}
        savePending={updateProject.isPending}
      />

      {canManageProject ? (
        <ProjectGovernanceCard
          isAdmin={isAdmin}
          handoverEmail={handoverEmail}
          onHandoverEmailChange={setHandoverEmail}
          onHandover={() => handoverProject.mutate()}
          handoverPending={handoverProject.isPending}
          memberUserId={memberUserId}
          onMemberUserIdChange={setMemberUserId}
          onAddMember={() => addMember.mutate()}
          addMemberPending={addMember.isPending}
          users={usersQuery.data?.users ?? []}
          usersLoading={usersQuery.isLoading}
          newUserEmail={newUserEmail}
          onNewUserEmailChange={setNewUserEmail}
          newUserPassword={newUserPassword}
          onNewUserPasswordChange={setNewUserPassword}
          onCreateUser={() => createUser.mutate()}
          createUserPending={createUser.isPending}
          members={membersQuery.data?.members ?? []}
          onRemoveMember={(userId) => removeMember.mutate(userId)}
          removeMemberPending={removeMember.isPending}
        />
      ) : null}
    </div>
  );
}
