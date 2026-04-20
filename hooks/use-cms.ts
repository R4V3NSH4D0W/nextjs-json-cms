import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import {
  cmsApi,
  type CmsBlockType,
  type CmsPageCreateBody,
  type CmsPageUpdateBody,
} from "@/lib/cms/api";
import { toast } from "sonner";

export type CmsBlockUpdateInput = {
  type?: CmsBlockType;
  config?: Record<string, unknown>;
  displayOrder?: number;
  isActive?: boolean;
};

// Page hooks
export const useCmsPages = () => {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-pages", currentProject?.slug],
    queryFn: () => cmsApi.listPages(currentProject!.slug),
    enabled: !!currentProject,
  });
};

export const useCmsPage = (id: string) => {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-pages", currentProject?.slug, id],
    queryFn: () => cmsApi.getPage(currentProject!.slug, id),
    enabled: !!id && !!currentProject,
  });
};

export const useCreateCmsPage = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CmsPageCreateBody) =>
      cmsApi.createPage(currentProject!.slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success("Page created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create page");
    },
  });
};

export const useUpdateCmsPage = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CmsPageUpdateBody }) =>
      cmsApi.updatePage(currentProject!.slug, id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages", id] });
      toast.success("Page updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update page");
    },
  });
};

export const useDeleteCmsPage = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsApi.deletePage(currentProject!.slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success("Page deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete page");
    },
  });
};

// Block hooks
export const useAddBlock = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      data,
    }: {
      pageId: string;
      data: {
        type: CmsBlockType;
        config?: Record<string, unknown>;
        isActive?: boolean;
      };
    }) => cmsApi.addBlock(currentProject!.slug, pageId, data),
    onSuccess: (_res, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages", pageId] });
      toast.success("Block added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add block");
    },
  });
};

export const useUpdateBlock = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      blockId,
      data,
    }: {
      pageId: string;
      blockId: string;
      data: CmsBlockUpdateInput;
    }) => cmsApi.updateBlock(currentProject!.slug, blockId, data),
    onSuccess: (_res, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages", pageId] });
      toast.success("Block updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update block");
    },
  });
};

export const useDeleteBlock = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, blockId }: { pageId: string; blockId: string }) =>
      cmsApi.deleteBlock(currentProject!.slug, blockId),
    onSuccess: (_res, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages", pageId] });
      toast.success("Block deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete block");
    },
  });
};

export const useReorderBlocks = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      orderedBlockIds,
    }: {
      pageId: string;
      orderedBlockIds: string[];
    }) =>
      cmsApi.reorderBlocks(currentProject!.slug, pageId, orderedBlockIds),
    onSuccess: (_res, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages", pageId] });
      toast.success("Blocks reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder blocks");
    },
  });
};

// Layout hooks
export const useCmsLayouts = () => {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-layouts", currentProject?.slug],
    queryFn: () => cmsApi.listLayouts(currentProject!.slug),
    enabled: !!currentProject,
  });
};

export const useCmsLayout = (id: string) => {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-layouts", currentProject?.slug, id],
    queryFn: () => cmsApi.getLayout(currentProject!.slug, id),
    enabled: !!id && !!currentProject,
  });
};

export const useCreateCmsLayout = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      rootKey: string;
      schema: Record<string, unknown>;
      referenceImageUrl?: string | null;
    }) => cmsApi.createLayout(currentProject!.slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-layouts"] });
      toast.success("Layout created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create layout");
    },
  });
};

export const useUpdateCmsLayout = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        rootKey?: string;
        schema?: Record<string, unknown>;
        referenceImageUrl?: string | null;
      };
    }) => cmsApi.updateLayout(currentProject!.slug, id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-layouts"] });
      queryClient.invalidateQueries({ queryKey: ["cms-layouts", id] });
      toast.success("Layout updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update layout");
    },
  });
};

export const useDeleteCmsLayout = () => {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      cmsApi.deleteLayout(currentProject!.slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-layouts"] });
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success("Layout deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete layout");
    },
  });
};
