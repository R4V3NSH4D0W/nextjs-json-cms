"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  LayoutTemplate,
  Menu,
  PanelBottom,
  Megaphone,
  Images,
  FolderKanban,
} from "lucide-react";

import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { cn } from "@/lib/shared/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const mainNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/media", label: "Media", icon: Images },
] as const;

const cmsNav = [
  { href: "/dashboard/cms", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/cms/pages", label: "Pages", icon: FileText },
  { href: "/dashboard/cms/layouts", label: "Layouts", icon: LayoutTemplate },
  { href: "/dashboard/cms/navigation", label: "Navigation", icon: Menu },
  { href: "/dashboard/cms/footer", label: "Footer", icon: PanelBottom },
  {
    href: "/dashboard/cms/announcements",
    label: "Announcements",
    icon: Megaphone,
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/cms") return pathname === "/dashboard/cms";
  if (href === "/dashboard/media")
    return (
      pathname === "/dashboard/media" ||
      pathname.startsWith("/dashboard/media/")
    );
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentProject } = useCurrentProject();
  const { isAdmin } = useCurrentUser();

  return (
    <Sidebar
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-primary text-sm font-bold text-primary-foreground"
            aria-hidden
          >
            C
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              Projects CMS
            </p>
            <p className="text-xs text-muted-foreground">
              {currentProject?.name ?? (isAdmin ? "Admin" : "Member")}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="scrollbar-hide gap-0 p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        active &&
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-wider">
            Project Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cmsNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        active &&
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
