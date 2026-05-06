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
import { Users, ShieldCheck, History, MoreHorizontal, ExternalLink } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { UserCreationDialog } from "@/components/dashboard/admin/user-creation-dialog";
import { UserActivityTimeline } from "@/components/dashboard/admin/user-activity-timeline";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => projectsApi.listAllUsers(),
  });

  const users = data?.users ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Users className="size-5" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Identity Platform</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Control platform access, provision administrative accounts, and monitor historical activity across all projects.
          </p>
        </div>
        <UserCreationDialog />
      </header>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] text-[10px] uppercase font-bold tracking-wider">User Identity</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-wider">Access Tier</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-wider">Project Affiliations</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-wider">Onboarded</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider pr-6">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm italic">
                  No users found in the system catalog.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="font-semibold">{user.email}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 gap-1.5 font-bold">
                        <ShieldCheck className="size-3" /> Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium text-muted-foreground">Standard User</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {user._count.projectAccess} projects
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-2 text-[10px] font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedUser({ id: user.id, email: user.email })}
                      >
                        <History className="size-3.5" /> Activity
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>User Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <ShieldCheck className="size-4" /> Toggle Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l-border/50">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <History className="size-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Administrative Audit</span>
            </div>
            <SheetTitle className="text-xl truncate">{selectedUser?.email}</SheetTitle>
            <SheetDescription>
              Chronological log of actions performed by or targeting this account for the last 30 days.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {selectedUser && <UserActivityTimeline userId={selectedUser.id} />}
          </div>
          <div className="p-4 border-t border-border bg-muted/5">
            <Button variant="outline" className="w-full text-xs font-bold h-9" onClick={() => setSelectedUser(null)}>
              Close Timeline
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
