"use client";

import { useQuery } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import { formatDistanceToNow } from "date-fns";
import { 
  History, 
  UserPlus, 
  UserMinus, 
  ShieldAlert, 
  Settings, 
  Key, 
  FileText, 
  Plus, 
  ToggleLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/shared/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type AuditLog = {
  id: string;
  action: string;
  performerId: string;
  performerEmail: string;
  projectSlug: string | null;
  projectId: string | null;
  targetUserId: string | null;
  metadata: any;
  createdAt: string;
};

const actionIcons: Record<string, any> = {
  PROJECT_CREATED: Plus,
  PROJECT_UPDATED: Settings,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  FEATURE_TOGGLED: ToggleLeft,
  USER_FEATURE_GRANTED: ShieldAlert,
  API_TOKEN_CREATED: Key,
  PAGE_CREATED: FileText,
  CONFIG_UPDATED: Settings,
};

const actionLabels: Record<string, string> = {
  PROJECT_CREATED: "Created project",
  PROJECT_UPDATED: "Updated project",
  MEMBER_ADDED: "Added member",
  MEMBER_REMOVED: "Removed member",
  FEATURE_TOGGLED: "Toggled project feature",
  USER_FEATURE_GRANTED: "Granted user feature",
  API_TOKEN_CREATED: "Generated API token",
  PAGE_CREATED: "Created CMS page",
  CONFIG_UPDATED: "Updated site config",
};

export function UserActivityTimeline({ userId, limit = 20 }: { userId: string; limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () => projectsApi.listUserActivity(userId, { limit }),
  });

  const logs = (data?.logs ?? []) as AuditLog[];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 text-center">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <History className="size-8 opacity-20 mb-2" />
        <p className="text-xs italic">No documented activity for this user.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {logs.map((log, i) => {
          const Icon = actionIcons[log.action] || History;
          const isTarget = log.targetUserId === userId;
          
          return (
            <div key={log.id} className="relative flex gap-4">
              {/* Timeline Line */}
              {i !== logs.length - 1 && (
                <div className="absolute left-[15px] top-8 h-full w-[1px] bg-border" />
              )}
              
              <div className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm",
                isTarget ? "border-amber-500/30 bg-amber-500/5 text-amber-500" : "text-primary"
              )}>
                <Icon className="size-4" />
              </div>
              
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold leading-none tracking-tight">
                    {actionLabels[log.action] || log.action.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <time className="text-[10px] text-muted-foreground tabular-nums">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </time>
                </div>
                
                <div className="flex flex-col gap-1">
                  {log.projectSlug && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <ChevronRight className="size-3" />
                      <span>Project: <span className="text-foreground">{log.projectSlug}</span></span>
                    </div>
                  )}
                  
                  {isTarget && (
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                      Action targeted this user
                    </p>
                  )}
                  
                  {!isTarget && log.performerId !== userId && (
                    <p className="text-[10px] text-muted-foreground">
                      By: <span className="font-medium text-foreground">{log.performerEmail}</span>
                    </p>
                  )}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 text-[10px] bg-muted/30 rounded p-1.5 font-mono overflow-auto max-h-24 hidden sm:block">
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
