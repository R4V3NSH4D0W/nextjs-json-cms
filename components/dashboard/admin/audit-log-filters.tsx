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
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "FEATURE_TOGGLED",
  "API_TOKEN_CREATED",
  "PAGE_CREATED",
  "PAGE_UPDATED",
  "PAGE_DELETED",
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

  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== "all");

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground mr-2">
        <Filter className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filter By</span>
      </div>

      <Select 
        value={filters.action ?? "all"} 
        onValueChange={(val) => onChange({ ...filters, action: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="h-9 w-[180px] bg-background text-xs">
          <SelectValue placeholder="Action Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {ACTION_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={filters.projectSlug ?? "all"} 
        onValueChange={(val) => onChange({ ...filters, projectSlug: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="h-9 w-[180px] bg-background text-xs">
          <SelectValue placeholder="Project Context" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {(projectsData?.projects ?? []).map(p => (
            <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={filters.performerId ?? "all"} 
        onValueChange={(val) => onChange({ ...filters, performerId: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="h-9 w-[220px] bg-background text-xs">
          <SelectValue placeholder="Performer (Admin)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Every Performer</SelectItem>
          {(usersData?.users ?? []).map(u => (
            <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
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
