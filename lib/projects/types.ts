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

export const CORE_CMS_PERMISSIONS = [
  "cms.pages.read",
  "cms.pages.write",
  "cms.layouts.read",
  "cms.layouts.write",
  "cms.navigation.read",
  "cms.navigation.write",
  "cms.footer.read",
  "cms.footer.write",
  "cms.announcements.read",
  "cms.announcements.write",
  "cms.media.read",
  "cms.media.write",
] as const;

export const SERVICE_KEYS = [
  "service.payments",
  "service.analytics",
  "service.notifications",
  "service.search",
  "service.email",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];
export type CmsPermission = (typeof CORE_CMS_PERMISSIONS)[number];
export type FeatureKey = ServiceKey | CmsPermission;

export type ServiceGrantSummary = {
  key: ServiceKey;
  label: string;
  description: string | null;
  enabledForProject: boolean;
};

export type ProjectMember = {
  createdAt: string;
  role: "admin";
  features: FeatureKey[];
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
};

export type AdminUserSummary = {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
};

export type ProjectUserDirectoryEntry = AdminUserSummary & {
  alreadyMember: boolean;
};

export type ProjectAccessSummary = {
  project: {
    id: string;
    slug: string;
    name: string;
  };
  hasProjectAccess: boolean;
  canManageProject: boolean;
  memberRole: "admin" | null;
  features: FeatureKey[];
};

export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "denied"
  | "cancelled";

export type AccessRequestSummary = {
  id: string;
  status: AccessRequestStatus;
  requestedServiceKeys: ServiceKey[];
  approvedServiceKeys: ServiceKey[];
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user?: {
    id: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    email: string;
  } | null;
  project: {
    id: string;
    slug: string;
    name: string;
  };
};

export type AuditLogEntry = {
  id: string;
  action: string;
  performerId: string;
  performerEmail: string;
  projectSlug: string | null;
  projectId: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown>;
  requestId: string | null;
  createdAt: string;
};

export type AdminNotificationItem = {
  id: string;
  action: string;
  projectSlug: string | null;
  performerEmail: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  unread: boolean;
};

export type AdminNotificationsResponse = {
  success: true;
  lastReadAt: string | null;
  unreadCount: number;
  notifications: AdminNotificationItem[];
};
