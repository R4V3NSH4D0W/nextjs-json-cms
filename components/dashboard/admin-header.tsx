"use client";

import Link from "next/link";
import { LogOut, PanelLeft } from "lucide-react";

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

export function AdminHeader({ userEmail }: { userEmail: string }) {
  const { open } = useSidebar();
  const { currentProject, projects } = useCurrentProject();
  const { isAdmin } = useCurrentUser();
  const initial = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      {!open && (
        <SidebarTrigger className="-ml-1">
          <PanelLeft className="size-5" />
          <span className="sr-only">Toggle sidebar</span>
        </SidebarTrigger>
      )}
      <div className="flex flex-1 items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          {currentProject ? `Project: ${currentProject.name}` : "Dashboard"}
        </p>
        <div className="flex items-center gap-2">
          {projects.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  {currentProject?.name ?? "Choose project"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Switch project</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.map((project) => (
                  <DropdownMenuItem key={project.id} asChild>
                    <Link
                      href={`/dashboard/projects/select?slug=${encodeURIComponent(project.slug)}&redirect=/dashboard`}
                    >
                      {project.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/">Home</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 gap-2 rounded-sm px-2"
              >
                <Avatar className="size-8 rounded-sm border border-border">
                  <AvatarFallback className="rounded-sm bg-muted text-xs font-semibold text-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate text-sm font-medium md:inline">
                  {userEmail}
                </span>
                <span className="hidden rounded bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground md:inline">
                  {isAdmin ? "Admin" : "Member"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Signed in
                  </span>
                  <span className="truncate text-sm font-medium">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  Public home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-2 text-left"
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
