import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
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
  return useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => cmsApi.listPages(),
  });
};

export const useCmsPage = (id: string) => {
  return useQuery({
    queryKey: ["cms-pages", id],
    queryFn: () => cmsApi.getPage(id),
    enabled: !!id,
  });
};

export const useCreateCmsPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CmsPageCreateBody) => cmsApi.createPage(data),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CmsPageUpdateBody }) =>
      cmsApi.updatePage(id, data),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsApi.deletePage(id),
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
    }) => cmsApi.addBlock(pageId, data),
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
    }) => cmsApi.updateBlock(blockId, data),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, blockId }: { pageId: string; blockId: string }) =>
      cmsApi.deleteBlock(blockId),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      orderedBlockIds,
    }: {
      pageId: string;
      orderedBlockIds: string[];
    }) => cmsApi.reorderBlocks(pageId, orderedBlockIds),
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
  return useQuery({
    queryKey: ["cms-layouts"],
    queryFn: () => cmsApi.listLayouts(),
  });
};

export const useCmsLayout = (id: string) => {
  return useQuery({
    queryKey: ["cms-layouts", id],
    queryFn: () => cmsApi.getLayout(id),
    enabled: !!id,
  });
};

export const useCreateCmsLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      rootKey: string;
      schema: Record<string, unknown>;
      referenceImageUrl?: string | null;
    }) => cmsApi.createLayout(data),
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
    }) => cmsApi.updateLayout(id, data),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsApi.deleteLayout(id),
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
