"use client";

import { useQuery } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  History, 
  Search, 
  Code,
  LayoutDashboard,
  ExternalLink,
  Info
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { AuditLogFilters, type AuditFilters } from "@/components/dashboard/admin/audit-log-filters";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/shared/utils";

export default function AdminAuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit", filters],
    queryFn: () => projectsApi.listAuditLogs(filters),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="space-y-2 border-b border-border pb-8">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="size-5" />
          <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Security & Compliance</p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Audit Log</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Immutable stream of administrative events. Monitor infrastructure changes, access grants, and configuration updates across the entire ecosystem.
        </p>
      </header>

      <div className="space-y-4">
        <AuditLogFilters filters={filters} onChange={setFilters} />

        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] text-[10px] uppercase font-bold tracking-wider">Timestamp</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Action</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Performer</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Context</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider pr-6">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground text-sm italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Search className="size-8 opacity-20" />
                       <p>No matching audit records found for the current filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="text-[11px] font-mono text-muted-foreground">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold tracking-tight px-2 py-0.5 border-border/50",
                        log.action.includes("CREATE") ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        log.action.includes("DELETE") || log.action.includes("REVOKE") ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                        "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {log.performerEmail}
                    </TableCell>
                    <TableCell>
                      {log.projectSlug ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <LayoutDashboard className="size-3" />
                          {log.projectSlug}
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/40">Platform</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-7 h-7 border-border/40 hover:bg-muted"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Code className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l-border/50">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Info className="size-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">Event Payload</span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {selectedLog?.action.replace(/_/g, " ")}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Complete technical state preserved at the time of the event.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-auto bg-[#0a0a0a] p-6">
            <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed h-full">
              {selectedLog ? JSON.stringify(selectedLog, null, 2) : ""}
            </pre>
          </div>

          <div className="p-4 border-t border-border bg-card">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Performer ID</p>
                <p className="text-xs font-mono truncate">{selectedLog?.performerId}</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Request ID</p>
                <p className="text-xs font-mono truncate">{selectedLog?.requestId || "None"}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold h-9 bg-background" onClick={() => setSelectedLog(null)}>
              Dismiss Inspector
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
