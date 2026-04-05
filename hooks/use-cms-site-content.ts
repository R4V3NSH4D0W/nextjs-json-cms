import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
import { toast } from "sonner";
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
  return useQuery({
    queryKey: ["cms-site", "navigation"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getNavigationConfig();
        const n = normalizeNavigationConfig(res.navigation);
        saveNavigationToStorage(n);
        return n;
      } catch {
        const local = loadNavigationFromStorage();
        if (local) return normalizeNavigationConfig(local);
        return defaultNavigationConfig();
      }
    },
  });
}

export function useUpdateCmsNavigationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsNavigationConfig) => {
      const normalized = normalizeNavigationConfig(data);
      try {
        const res = await cmsApi.putNavigationConfig(normalized);
        const n = normalizeNavigationConfig(res.navigation);
        saveNavigationToStorage(n);
        return { source: "api" as const, config: n };
      } catch {
        saveNavigationToStorage(normalized);
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
  return useQuery({
    queryKey: ["cms-site", "footer"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getFooterConfig();
        const f = normalizeFooterConfig(res.footer);
        saveFooterToStorage(f);
        return f;
      } catch {
        const local = loadFooterFromStorage();
        if (local) return normalizeFooterConfig(local);
        return defaultFooterConfig();
      }
    },
  });
}

export function useUpdateCmsFooterConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsFooterConfig) => {
      const normalized = normalizeFooterConfig(data);
      try {
        const res = await cmsApi.putFooterConfig(normalized);
        const f = normalizeFooterConfig(res.footer);
        saveFooterToStorage(f);
        return { source: "api" as const, config: f };
      } catch {
        saveFooterToStorage(normalized);
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
  return useQuery({
    queryKey: ["cms-site", "announcements"],
    queryFn: async () => {
      try {
        const res = await cmsApi.getAnnouncementsConfig();
        const a = normalizeAnnouncementsConfig(res.announcements);
        saveAnnouncementsToStorage(a);
        return a;
      } catch {
        const local = loadAnnouncementsFromStorage();
        if (local) return normalizeAnnouncementsConfig(local);
        return defaultAnnouncementsConfig();
      }
    },
  });
}

export function useUpdateCmsAnnouncementsConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CmsAnnouncementsConfig) => {
      const normalized = normalizeAnnouncementsConfig(data);
      try {
        const res = await cmsApi.putAnnouncementsConfig(normalized);
        const a = normalizeAnnouncementsConfig(res.announcements);
        saveAnnouncementsToStorage(a);
        return { source: "api" as const, config: a };
      } catch {
        saveAnnouncementsToStorage(normalized);
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
