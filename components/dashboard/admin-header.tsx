"use client";

import Link from "next/link";
import { LogOut, PanelLeft, ShieldCheck } from "lucide-react";

import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminHeader({
  userEmail,
  mode = "dashboard",
}: {
  userEmail: string;
  mode?: "admin" | "dashboard";
}) {
  const { open } = useSidebar();
  const { currentProject, projects } = useCurrentProject();
  const { isAdmin } = useCurrentUser();
  const initial = userEmail.slice(0, 2).toUpperCase();
  const activeProjects = projects.filter(
    (project) => project.status === "active",
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      {!open && (
        <SidebarTrigger className="-ml-1">
          <PanelLeft className="size-5" />
          <span className="sr-only">Toggle sidebar</span>
        </SidebarTrigger>
      )}
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {mode === "admin"
              ? "Platform Administration"
              : currentProject
                ? `Project: ${currentProject.name}`
                : "Dashboard"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "dashboard" && activeProjects.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex gap-2 border-border/60 hover:bg-muted font-medium"
                >
                  {currentProject?.name ?? "Select Project"}
                  <PanelLeft className="size-3.5 -rotate-90 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-2 shadow-xl border-border/50"
              >
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pb-2 px-2">
                  Switch Workspace
                </DropdownMenuLabel>
                {activeProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    asChild
                    className="rounded-md focus:bg-primary/5 focus:text-primary transition-colors"
                  >
                    <Link
                      href={`/dashboard/projects/select?slug=${encodeURIComponent(project.slug)}&redirect=/dashboard`}
                      className="flex items-center justify-between w-full"
                    >
                      <span>{project.name}</span>
                      {currentProject?.id === project.id && (
                        <div className="size-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      asChild
                      className="rounded-md focus:bg-primary/5 focus:text-primary transition-colors"
                    >
                      <Link
                        href="/admin/projects"
                        className="font-bold text-xs uppercase tracking-tight"
                      >
                        Manage All Projects
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 gap-2 rounded-sm px-2 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="size-8 rounded-sm border border-border/50">
                  <AvatarFallback className="rounded-sm bg-primary/10 text-xs font-bold text-primary uppercase">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start gap-0.5 text-left md:flex">
                  <span className="max-w-35 truncate text-xs font-semibold leading-none">
                    {userEmail}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {isAdmin ? "Super Admin" : "Project Member"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 p-2 shadow-xl border-border/50"
            >
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">
                    Session Profile
                  </span>
                  <span className="truncate text-sm font-semibold pt-1">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              {isAdmin && mode === "dashboard" && (
                <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                  <Link href="/admin" className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Platform Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 text-left text-destructive"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
