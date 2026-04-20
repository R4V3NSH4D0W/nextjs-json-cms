import { api } from "@/lib/fetcher";

export type ProjectStatus = "active" | "archived";

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  primaryDomain: string | null;
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectToken = {
  id: string;
  label: string;
  active: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export const projectsApi = {
  list: () => api.get<{ success: true; projects: ProjectSummary[] }>("/api/v1/admin/projects"),
  get: (projectSlug: string) =>
    api.get<{ success: true; project: ProjectSummary }>(
      `/api/v1/admin/projects/${projectSlug}`,
    ),
  create: (body: {
    name: string;
    slug?: string;
    description?: string | null;
    primaryDomain?: string | null;
    allowedOrigins?: string[];
  }) => api.post<{ success: true; project: ProjectSummary }>("/api/v1/admin/projects", body),
  update: (
    projectSlug: string,
    body: Partial<{
      name: string;
      slug: string;
      description: string | null;
      primaryDomain: string | null;
      status: ProjectStatus;
      allowedOrigins: string[];
    }>,
  ) =>
    api.patch<{ success: true; project: ProjectSummary }>(
      `/api/v1/admin/projects/${projectSlug}`,
      body,
    ),
  listTokens: (projectSlug: string) =>
    api.get<{ success: true; tokens: ProjectToken[] }>(
      `/api/v1/admin/projects/${projectSlug}/tokens`,
    ),
  createToken: (
    projectSlug: string,
    body: { label: string; expiresAt?: string | null },
  ) =>
    api.post<{ success: true; token: string; record: ProjectToken }>(
      `/api/v1/admin/projects/${projectSlug}/tokens`,
      body,
    ),
  revokeToken: (projectSlug: string, tokenId: string) =>
    api.delete<{ success: true }>(
      `/api/v1/admin/projects/${projectSlug}/tokens/${tokenId}`,
    ),
};
