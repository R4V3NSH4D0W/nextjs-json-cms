import { api } from "@/lib/fetcher";
import type {
  ProjectSummary,
  ProjectAccessSummary,
  ProjectStatus,
  ProjectToken,
  ProjectMember,
  ProjectUserDirectoryEntry,
  AdminUserSummary,
  AuditLogEntry,
  ServiceGrantSummary,
  ServiceKey,
  AccessRequestSummary,
} from "./types";
export * from "./types";

export const projectsApi = {
  list: () => api.get<{ success: true; projects: ProjectSummary[] }>("/api/v1/admin/projects"),
  get: (projectSlug: string) =>
    api.get<{ success: true; project: ProjectSummary }>(
      `/api/v1/admin/projects/${projectSlug}`,
    ),
  getAccess: (projectSlug: string) =>
    api.get<{ success: true; access: ProjectAccessSummary }>(
      `/api/v1/admin/projects/${projectSlug}/access`,
    ),
  create: (body: {
    name: string;
    slug?: string;
    description?: string | null;
    primaryDomain?: string | null;
    allowedOrigins?: string[];
    handoverUserId?: string;
    handoverEmail?: string;
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
  deleteProject: (projectSlug: string) =>
    api.delete<{ success: true }>(`/api/v1/admin/projects/${projectSlug}`),
  restoreProject: (projectSlug: string) =>
    api.post<{ success: true; project: ProjectSummary }>(
      `/api/v1/admin/projects/${projectSlug}/restore`,
      {},
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
  listMembers: (projectSlug: string) =>
    api.get<{ success: true; members: ProjectMember[] }>(
      `/api/v1/admin/projects/${projectSlug}/members`,
    ),
  addMember: (
    projectSlug: string,
    body: { userId?: string; email?: string; role?: "manager" | "member" },
  ) =>
    api.post<{
      success: true;
      user: { id: string; email: string; isAdmin: boolean };
      membership: { id: string; createdAt: string; role: "manager" | "member" };
    }>(`/api/v1/admin/projects/${projectSlug}/members`, body),
  listProjectUsers: (projectSlug: string, query?: string) =>
    api.get<{ success: true; users: ProjectUserDirectoryEntry[] }>(
      `/api/v1/admin/projects/${projectSlug}/users`,
      {
        params: {
          query,
        },
      },
    ),
  createUser: (body: { email: string; password: string; isAdmin?: boolean }) =>
    api.post<{ success: true; user: AdminUserSummary }>(
      "/api/v1/admin/projects/users",
      body,
    ),
  listAllUsers: () => 
    api.get<{ success: true; users: (AdminUserSummary & { _count: { projectAccess: number } })[] }>(
      "/api/v1/admin/projects/users"
    ),
  listAuditLogs: (params?: { performerId?: string; targetUserId?: string; projectSlug?: string; action?: string; limit?: number; page?: number }) =>
    api.get<{ success: true; logs: AuditLogEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/api/v1/admin/audit", { params }),
  getAuditLog: (logId: string) =>
    api.get<{ success: true; log: AuditLogEntry }>(`/api/v1/admin/audit/${logId}`),
  listUserActivity: (userId: string, params?: { limit?: number }) =>
    api.get<{ success: true; logs: AuditLogEntry[] }>(`/api/v1/admin/audit/users/${userId}`, { params }),
  handoverProject: (
    projectSlug: string,
    body: { userId?: string; email?: string },
  ) =>
    api.post<{
      success: true;
      user: { id: string; email: string; isAdmin: boolean };
    }>(`/api/v1/admin/projects/${projectSlug}/handover`, body),
  removeMember: (projectSlug: string, userId: string) =>
    api.delete<{ success: true }>(
      `/api/v1/admin/projects/${projectSlug}/members/${userId}`,
    ),
  listProjectServices: (projectSlug: string) =>
    api.get<{ success: true; services: ServiceGrantSummary[] }>(
      `/api/v1/admin/projects/${projectSlug}/services`,
    ),
  setProjectService: (
    projectSlug: string,
    serviceKey: ServiceKey,
    enabled: boolean,
  ) =>
    api.put<{
      success: true;
      grant: {
        id: string;
        projectId: string;
        serviceKey: ServiceKey;
        enabled: boolean;
        updatedAt: string;
      };
    }>(`/api/v1/admin/projects/${projectSlug}/services/${serviceKey}`, { enabled }),
  grantMemberServices: (
    projectSlug: string,
    userId: string,
    serviceKeys: ServiceKey[],
  ) =>
    api.post<{ success: true; grants: Array<{ serviceKey: ServiceKey }> }>(
      `/api/v1/admin/projects/${projectSlug}/members/${userId}/services`,
      { serviceKeys },
    ),
  revokeMemberService: (
    projectSlug: string,
    userId: string,
    serviceKey: ServiceKey,
  ) =>
    api.delete<{ success: true }>(
      `/api/v1/admin/projects/${projectSlug}/members/${userId}/services/${serviceKey}`,
    ),
  submitAccessRequest: (
    projectSlug: string,
    body: { serviceKeys: ServiceKey[]; note?: string },
  ) =>
    api.post<{ success: true; request: AccessRequestSummary }>(
      `/api/v1/admin/projects/${projectSlug}/access-requests`,
      body,
    ),
  listOwnAccessRequests: () =>
    api.get<{ success: true; requests: AccessRequestSummary[] }>(
      "/api/v1/admin/projects/access-requests/mine",
    ),
  cancelOwnAccessRequest: (requestId: string) =>
    api.delete<{ success: true }>(
      `/api/v1/admin/projects/access-requests/mine/${requestId}`,
    ),
  listPendingAccessRequests: (projectSlug?: string) =>
    api.get<{ success: true; requests: AccessRequestSummary[] }>(
      "/api/v1/admin/projects/access-requests/pending",
      {
        params: {
          projectSlug,
        },
      },
    ),
  reviewAccessRequest: (
    requestId: string,
    body: {
      decision: "approve" | "deny";
      approvedServiceKeys?: ServiceKey[];
      reviewNote?: string;
    },
  ) =>
    api.post<{ success: true; request: AccessRequestSummary }>(
      `/api/v1/admin/projects/access-requests/${requestId}/review`,
      body,
    ),
};
