"use client";

import { useQuery } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

export type AuditFilters = {
  action?: string;
  projectSlug?: string;
  performerId?: string;
};

interface AuditLogFiltersProps {
  filters: AuditFilters;
  onChange: (filters: AuditFilters) => void;
}

const ACTION_OPTIONS = [
  { value: "PROJECT_CREATED", label: "Project Created" },
  { value: "PROJECT_UPDATED", label: "Project Updated" },
  { value: "PROJECT_ARCHIVED", label: "Project Archived" },
  { value: "PROJECT_RESTORED", label: "Project Restored" },
  { value: "MEMBER_ADDED", label: "Member Added" },
  { value: "MEMBER_REMOVED", label: "Member Removed" },
  { value: "FEATURE_TOGGLED", label: "Feature Toggled" },
  { value: "API_TOKEN_CREATED", label: "API Token Created" },
  { value: "PAGE_CREATED", label: "Page Created" },
  { value: "PAGE_UPDATED", label: "Page Updated" },
  { value: "PAGE_DELETED", label: "Page Archived / Deleted" },
  { value: "PAGE_RESTORED", label: "Page Restored" },
  { value: "BLOCK_DELETED", label: "Block Archived / Deleted" },
  { value: "BLOCK_RESTORED", label: "Block Restored" },
  { value: "MEDIA_FILE_TRASHED", label: "Media File Archived" },
  { value: "MEDIA_FOLDER_TRASHED", label: "Media Folder Archived" },
];

export function AuditLogFilters({ filters, onChange }: AuditLogFiltersProps) {
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => projectsApi.listAllUsers(),
  });

  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "all",
  );

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground mr-2">
        <Filter className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Filter By
        </span>
      </div>

      <Select
        value={filters.action ?? "all"}
        onValueChange={(val) =>
          onChange({ ...filters, action: val === "all" ? undefined : val })
        }
      >
        <SelectTrigger className="h-9 w-45 bg-background text-xs">
          <SelectValue placeholder="Action Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.projectSlug ?? "all"}
        onValueChange={(val) =>
          onChange({ ...filters, projectSlug: val === "all" ? undefined : val })
        }
      >
        <SelectTrigger className="h-9 w-45 bg-background text-xs">
          <SelectValue placeholder="Project Context" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {(projectsData?.projects ?? []).map((p) => (
            <SelectItem key={p.id} value={p.slug}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.performerId ?? "all"}
        onValueChange={(val) =>
          onChange({ ...filters, performerId: val === "all" ? undefined : val })
        }
      >
        <SelectTrigger className="h-9 w-55 bg-background text-xs">
          <SelectValue placeholder="Performer (Admin)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Every Performer</SelectItem>
          {(usersData?.users ?? []).map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5 mr-1" />
          <span className="text-[10px] font-bold uppercase">Clear</span>
        </Button>
      )}
    </div>
  );
}
