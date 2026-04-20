import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
import { toast } from "sonner";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { cmsApi } from "@/lib/cms/api";
import {
  defaultAnnouncementsConfig,
  defaultFooterConfig,
  defaultNavigationConfig,
  normalizeAnnouncementsConfig,
  normalizeFooterConfig,
  normalizeNavigationConfig,
  type CmsAnnouncementsConfig,
  type CmsFooterConfig,
  type CmsNavigationConfig,
} from "@/lib/cms/site-content-types";
import {
  loadAnnouncementsFromStorage,
  loadFooterFromStorage,
  loadNavigationFromStorage,
  saveAnnouncementsToStorage,
  saveFooterToStorage,
  saveNavigationToStorage,
} from "@/lib/cms/site-content-storage";

export function useCmsNavigationConfig() {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-site", currentProject?.slug, "navigation"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getNavigationConfig(currentProject!.slug);
        const n = normalizeNavigationConfig(res.navigation);
        saveNavigationToStorage(currentProject!.slug, n);
        return n;
      } catch {
        const local = loadNavigationFromStorage(currentProject!.slug);
        if (local) return normalizeNavigationConfig(local);
        return defaultNavigationConfig();
      }
    },
    enabled: !!currentProject,
  });
}

export function useUpdateCmsNavigationConfig() {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsNavigationConfig) => {
      const normalized = normalizeNavigationConfig(data);
      try {
        const res = await cmsApi.putNavigationConfig(currentProject!.slug, normalized);
        const n = normalizeNavigationConfig(res.navigation);
        saveNavigationToStorage(currentProject!.slug, n);
        return { source: "api" as const, config: n };
      } catch {
        saveNavigationToStorage(currentProject!.slug, normalized);
        return { source: "local" as const, config: normalized };
      }
    },
    onSuccess: ({ source, config }) => {
      queryClient.setQueryData(["cms-site", "navigation"], config);
      toast.success(
        source === "api"
          ? "Navigation saved"
          : "Saved locally — connect API to persist on the server"
      );
    },
  });
}

export function useCmsFooterConfig() {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-site", currentProject?.slug, "footer"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getFooterConfig(currentProject!.slug);
        const f = normalizeFooterConfig(res.footer);
        saveFooterToStorage(currentProject!.slug, f);
        return f;
      } catch {
        const local = loadFooterFromStorage(currentProject!.slug);
        if (local) return normalizeFooterConfig(local);
        return defaultFooterConfig();
      }
    },
    enabled: !!currentProject,
  });
}

export function useUpdateCmsFooterConfig() {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsFooterConfig) => {
      const normalized = normalizeFooterConfig(data);
      try {
        const res = await cmsApi.putFooterConfig(currentProject!.slug, normalized);
        const f = normalizeFooterConfig(res.footer);
        saveFooterToStorage(currentProject!.slug, f);
        return { source: "api" as const, config: f };
      } catch {
        saveFooterToStorage(currentProject!.slug, normalized);
        return { source: "local" as const, config: normalized };
      }
    },
    onSuccess: ({ source, config }) => {
      queryClient.setQueryData(["cms-site", "footer"], config);
      toast.success(
        source === "api"
          ? "Footer saved"
          : "Saved locally — connect API to persist on the server"
      );
    },
  });
}

export function useCmsAnnouncementsConfig() {
  const { currentProject } = useCurrentProject();
  return useQuery({
    queryKey: ["cms-site", currentProject?.slug, "announcements"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getAnnouncementsConfig(currentProject!.slug);
        const a = normalizeAnnouncementsConfig(res.announcements);
        saveAnnouncementsToStorage(currentProject!.slug, a);
        return a;
      } catch {
        const local = loadAnnouncementsFromStorage(currentProject!.slug);
        if (local) return normalizeAnnouncementsConfig(local);
        return defaultAnnouncementsConfig();
      }
    },
    enabled: !!currentProject,
  });
}

export function useUpdateCmsAnnouncementsConfig() {
  const { currentProject } = useCurrentProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsAnnouncementsConfig) => {
      const normalized = normalizeAnnouncementsConfig(data);
      try {
        const res = await cmsApi.putAnnouncementsConfig(currentProject!.slug, normalized);
        const a = normalizeAnnouncementsConfig(res.announcements);
        saveAnnouncementsToStorage(currentProject!.slug, a);
        return { source: "api" as const, config: a };
      } catch {
        saveAnnouncementsToStorage(currentProject!.slug, normalized);
        return { source: "local" as const, config: normalized };
      }
    },
    onSuccess: ({ source, config }) => {
      queryClient.setQueryData(["cms-site", "announcements"], config);
      toast.success(
        source === "api"
          ? "Announcements saved"
          : "Saved locally — connect API to persist on the server"
      );
    },
  });
}
