"use client";

import { use } from "react";
import { toast } from "sonner";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/lib/shared/react-query";
import { cmsBlockApi, cmsPageApi, mediaApi } from "@/lib/api/services";
import { ProjectRecycleBinCard } from "@/components/dashboard/projects/project-settings-sections";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { Badge } from "@/components/ui/badge";

export default function RecycleBinPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const params = use(searchParams);
  const selectedSlug = params.slug;

  const queryClient = useQueryClient();
  const { currentProject, currentAccess } = useCurrentProject();
  const { isAdmin } = useCurrentUser();

  const slug = selectedSlug ?? currentProject?.slug ?? "";

  const canManageProject = isAdmin || currentAccess?.canManageProject === true;

  const deletedPagesQuery = useQuery({
    queryKey: ["project-recycle-pages", slug],
    queryFn: () => cmsPageApi.listDeleted(slug),
    enabled: !!slug && canManageProject,
  });

  const deletedBlocksQuery = useQuery({
    queryKey: ["project-recycle-blocks", slug],
    queryFn: () => cmsBlockApi.listDeleted(slug),
    enabled: !!slug && canManageProject,
  });

  const mediaTrashQuery = useQuery({
    queryKey: ["project-recycle-media", slug],
    queryFn: () => mediaApi.listTrash(slug),
    enabled: !!slug && canManageProject,
  });

  const restorePage = useMutation({
    mutationFn: (pageId: string) => cmsPageApi.restore(slug, pageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-pages", slug],
      });
      toast.success("Page restored");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const purgePage = useMutation({
    mutationFn: (pageId: string) => cmsPageApi.purgeDeleted(slug, pageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-pages", slug],
      });
      toast.success("Page permanently deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restoreBlock = useMutation({
    mutationFn: (blockId: string) => cmsBlockApi.restore(slug, blockId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-blocks", slug],
      });
      toast.success("Block restored");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const purgeBlock = useMutation({
    mutationFn: (blockId: string) => cmsBlockApi.purgeDeleted(slug, blockId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-blocks", slug],
      });
      toast.success("Block permanently deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restoreMedia = useMutation({
    mutationFn: (trashKey: string) =>
      mediaApi.restoreFromTrash(slug, { trashKey }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-media", slug],
      });
      toast.success("Media restored");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const purgeMedia = useMutation({
    mutationFn: (trashKey: string) => mediaApi.purgeTrashItem(slug, trashKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-recycle-media", slug],
      });
      toast.success("Media permanently deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">
          Restore Workspace
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Recycle Bin</h1>
        <p className="text-sm text-muted-foreground">
          Manage archived pages, blocks, and media from one place. Restore in
          one click.
        </p>
      </div>

      {!slug ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Select a project first to view archived content.
        </div>
      ) : !canManageProject ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Only administrators can restore archived content.
        </div>
      ) : (
        <ProjectRecycleBinCard
          deletedPages={deletedPagesQuery.data?.pages ?? []}
          deletedBlocks={deletedBlocksQuery.data?.blocks ?? []}
          mediaTrashItems={mediaTrashQuery.data?.items ?? []}
          onRestorePage={(pageId) => restorePage.mutate(pageId)}
          onRestoreBlock={(blockId) => restoreBlock.mutate(blockId)}
          onRestoreMedia={(trashKey) => restoreMedia.mutate(trashKey)}
          onPurgePage={(pageId) => purgePage.mutate(pageId)}
          onPurgeBlock={(blockId) => purgeBlock.mutate(blockId)}
          onPurgeMedia={(trashKey) => purgeMedia.mutate(trashKey)}
          restorePending={
            restorePage.isPending ||
            restoreBlock.isPending ||
            restoreMedia.isPending ||
            purgePage.isPending ||
            purgeBlock.isPending ||
            purgeMedia.isPending
          }
        />
      )}
    </div>
  );
}
