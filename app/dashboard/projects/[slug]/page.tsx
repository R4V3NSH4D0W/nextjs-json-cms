"use client";

import { use, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/lib/shared/react-query";
import { type FeatureKey, projectsApi } from "@/lib/projects/api";
import {
  ProjectGovernanceCard,
  ProjectProfileCard,
  ProjectSettingsHero,
  ProjectTokensCard,
} from "@/components/dashboard/projects/project-settings-sections";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { useCurrentProject } from "@/components/providers/current-project-provider";

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { isAdmin } = useCurrentUser();
  const { currentAccess } = useCurrentProject();
  const canManageProject = isAdmin || currentAccess?.canManageProject === true;

  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [memberUserId, setMemberUserId] = useState("");
  const [handoverEmail, setHandoverEmail] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [memberSelectedFeaturesByUser, setMemberSelectedFeaturesByUser] =
    useState<Record<string, FeatureKey[]>>({});
  const [fieldOverridesBySlug, setFieldOverridesBySlug] = useState<
    Record<
      string,
      Partial<{
        name: string;
        description: string;
        primaryDomain: string;
        allowedOrigins: string;
      }>
    >
  >({});

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

  const membersQuery = useQuery({
    queryKey: ["project-members", slug],
    queryFn: () => projectsApi.listMembers(slug),
    enabled: !!slug && canManageProject,
  });

  const featuresQuery = useQuery({
    queryKey: ["project-features", slug],
    queryFn: () => projectsApi.listProjectFeatures(slug),
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
    const currentFieldOverrides = fieldOverridesBySlug[slug] ?? {};
    return { ...baseFields, ...currentFieldOverrides };
  }, [baseFields, fieldOverridesBySlug, slug]);

  const enabledProjectFeatureKeys = useMemo(
    () =>
      (featuresQuery.data?.features ?? [])
        .filter((feature) => feature.enabledForProject)
        .map((feature) => feature.key),
    [featuresQuery.data?.features],
  );

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
      setFieldOverridesBySlug((prev) => {
        if (!(slug in prev)) return prev;
        const next = { ...prev };
        delete next[slug];
        return next;
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["project-tokens", slug],
      });
      toast.success("Token created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeToken = useMutation({
    mutationFn: (tokenId: string) => projectsApi.revokeToken(slug, tokenId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-tokens", slug],
      });
      toast.success("Token revoked");
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

  const toggleProjectFeature = useMutation({
    mutationFn: ({
      featureKey,
      enabled,
    }: {
      featureKey: FeatureKey;
      enabled: boolean;
    }) => projectsApi.setProjectFeature(slug, featureKey, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-features", slug],
      });
      toast.success("Project feature updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grantMemberFeatures = useMutation({
    mutationFn: ({
      userId,
      featureKeys,
    }: {
      userId: string;
      featureKeys: FeatureKey[];
    }) => projectsApi.grantMemberFeatures(slug, userId, featureKeys),
    onSuccess: async (_, vars) => {
      setMemberSelectedFeaturesByUser((prev) => ({
        ...prev,
        [vars.userId]: [],
      }));
      await queryClient.invalidateQueries({
        queryKey: ["project-members", slug],
      });
      toast.success("Member feature grants updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeMemberFeature = useMutation({
    mutationFn: ({
      userId,
      featureKey,
    }: {
      userId: string;
      featureKey: FeatureKey;
    }) => projectsApi.revokeMemberFeature(slug, userId, featureKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", slug],
      });
      toast.success("Feature revoked");
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

  function toggleSelectedFeature(userId: string, featureKey: FeatureKey) {
    setMemberSelectedFeaturesByUser((prev) => {
      const existing = prev[userId] ?? [];
      const next = existing.includes(featureKey)
        ? existing.filter((key) => key !== featureKey)
        : [...existing, featureKey];
      return { ...prev, [userId]: next };
    });
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

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <ProjectProfileCard
          fields={fields}
          onFieldChange={(key, value) =>
            setFieldOverridesBySlug((prev) => ({
              ...prev,
              [slug]: {
                ...(prev[slug] ?? {}),
                [key]: value,
              },
            }))
          }
          onSave={() => updateProject.mutate()}
          savePending={updateProject.isPending}
        />

        <ProjectTokensCard
          newTokenLabel={newTokenLabel}
          onTokenLabelChange={setNewTokenLabel}
          onCreateToken={() => createToken.mutate()}
          createTokenPending={createToken.isPending}
          plainToken={plainToken}
          tokens={tokensQuery.data?.tokens ?? []}
          onRevokeToken={(tokenId) => revokeToken.mutate(tokenId)}
          revokeTokenPending={revokeToken.isPending}
        />
      </div>

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
          onRevokeMemberFeature={(userId, featureKey) =>
            revokeMemberFeature.mutate({ userId, featureKey })
          }
          revokeMemberFeaturePending={revokeMemberFeature.isPending}
          enabledProjectFeatureKeys={enabledProjectFeatureKeys}
          selectedFeaturesByUser={memberSelectedFeaturesByUser}
          onToggleSelectedFeature={toggleSelectedFeature}
          onGrantMemberFeatures={(userId, featureKeys) =>
            grantMemberFeatures.mutate({ userId, featureKeys })
          }
          grantMemberFeaturesPending={grantMemberFeatures.isPending}
          features={featuresQuery.data?.features ?? []}
          onToggleProjectFeature={(featureKey, enabled) =>
            toggleProjectFeature.mutate({ featureKey, enabled })
          }
          toggleProjectFeaturePending={toggleProjectFeature.isPending}
        />
      ) : null}
    </div>
  );
}
