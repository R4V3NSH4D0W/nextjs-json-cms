import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Clock3, LayoutDashboard, ShieldCheck } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import type { AuditLogEntry } from "@/lib/projects/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/shared/utils";

function getAuditActionLabel(
  action: string,
  metadata: Record<string, unknown>,
) {
  const permanent = metadata.permanent === true;
  switch (action) {
    case "PROJECT_ARCHIVED":
      return "Archived Project";
    case "PROJECT_DELETED":
      return permanent ? "Permanently Deleted Project" : "Deleted Project";
    case "PAGE_DELETED":
      return permanent ? "Permanently Deleted Page" : "Archived Page";
    case "PAGE_RESTORED":
      return "Restored Page";
    case "BLOCK_DELETED":
      return permanent ? "Permanently Deleted Block" : "Archived Block";
    case "BLOCK_RESTORED":
      return "Restored Block";
    case "MEDIA_FILE_TRASHED":
      return permanent
        ? "Permanently Deleted Media File"
        : "Media File Archived";
    case "MEDIA_FOLDER_TRASHED":
      return permanent
        ? "Permanently Deleted Media Folder"
        : "Media Folder Archived";
    case "PROJECT_RESTORED":
      return "Restored Project";
    default:
      return action.replace(/_/g, " ");
  }
}

function getAuditActionTone(action: string, metadata: Record<string, unknown>) {
  const permanent = metadata.permanent === true;
  if (permanent) return "bg-rose-500/10 text-rose-700 border-rose-500/20";
  if (
    action.includes("ARCHIVED") ||
    action.includes("TRASHED") ||
    action.includes("RESTORED")
  ) {
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  }
  if (
    action.includes("CREATE") ||
    action.includes("GRANTED") ||
    action.includes("ADDED")
  ) {
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  }
  if (
    action.includes("REVOKE") ||
    action.includes("REMOVED") ||
    action.includes("DELETED")
  ) {
    return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  }
  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
}

async function loadAuditLog(logId: string): Promise<AuditLogEntry> {
  const session = await getSession();
  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/admin/audit/${logId}`)}`,
    );
  }

  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

  const res = await fetch(
    `${apiUrl}/api/v1/admin/audit/${encodeURIComponent(logId)}`,
    {
      headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
      cache: "no-store",
    },
  );

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as { success: true; log: AuditLogEntry };
  return data.log;
}

export default async function AuditLogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;
  const log = await loadAuditLog(logId);
  const metadata = log.metadata ?? {};
  const actionLabel = getAuditActionLabel(log.action, metadata);
  const actionTone = getAuditActionTone(log.action, metadata);
  const metadataEntries = Object.entries(metadata);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-fit px-0 text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/audit">
              <ArrowLeft className="mr-2 size-4" /> Back to Audit Log
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Security & Compliance
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{actionLabel}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Dedicated audit event page with more horizontal space for context,
            metadata, and the raw JSON payload.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "w-fit px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
            actionTone,
          )}
        >
          {log.action.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="shadow-sm border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">Event Summary</CardTitle>
              <CardDescription>
                Key context and identifiers for this event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Performer
                </p>
                <p className="mt-1 font-semibold">{log.performerEmail}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {log.performerId}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Context
                </p>
                <p className="mt-1 font-semibold">
                  {log.projectSlug ?? "Platform"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {log.projectId ?? "No project id"}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Request
                </p>
                <p className="mt-1 font-semibold">{log.requestId || "None"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Action Tone
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-2 w-fit border-border/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                    actionTone,
                  )}
                >
                  {actionLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
              <CardDescription>
                {metadataEntries.length} key(s) captured with the event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metadataEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No metadata was recorded for this event.
                </p>
              ) : (
                metadataEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {key}
                    </p>
                    <p className="mt-1 wrap-break-word text-sm font-medium">
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border/60 bg-card/70">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Raw Payload</CardTitle>
                <CardDescription>
                  Full JSON event payload rendered with more room to read.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] uppercase tracking-wide"
              >
                JSON
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto bg-[#09111f] p-5">
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-5 text-[12px] leading-relaxed text-emerald-300">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
