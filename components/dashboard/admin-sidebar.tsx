"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Trash2,
  Menu,
  PanelBottom,
  Megaphone,
  Images,
  Hammer,
  FolderKanban,
  ShieldCheck,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { cn } from "@/lib/shared/utils";
import { Button } from "@/components/ui/button";
import { type FeatureKey } from "@/lib/projects/api";
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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: FeatureKey;
};

const platformNav: NavItem[] = [
  { href: "/admin", label: "Platform Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "All Projects", icon: FolderKanban },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit Logs", icon: ShieldCheck },
];

const projectMainNavBase: NavItem[] = [
  { href: "/dashboard", label: "Project Overview", icon: LayoutDashboard },
  {
    href: "/dashboard/media",
    label: "Media",
    icon: Images,
    feature: "cms.media.read",
  },
];

const cmsNav: NavItem[] = [
  {
    href: "/dashboard/cms/pages",
    label: "Pages",
    icon: FileText,
    feature: "cms.pages.read",
  },
  {
    href: "/dashboard/cms/layouts",
    label: "Layouts",
    icon: LayoutTemplate,
    feature: "cms.layouts.read",
  },
  {
    href: "/dashboard/cms/tools",
    label: "Tools",
    icon: Hammer,
    feature: "cms.layouts.read",
  },
  {
    href: "/dashboard/cms/navigation",
    label: "Navigation",
    icon: Menu,
    feature: "cms.navigation.read",
  },
  {
    href: "/dashboard/cms/footer",
    label: "Footer",
    icon: PanelBottom,
    feature: "cms.footer.read",
  },
  {
    href: "/dashboard/cms/announcements",
    label: "Announcements",
    icon: Megaphone,
    feature: "cms.announcements.read",
  },
  {
    href: "/dashboard/settings",
    label: "Project Settings",
    icon: Settings,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  mode = "dashboard",
}: {
  mode?: "admin" | "dashboard";
}) {
  const pathname = usePathname();
  const { currentProject, currentAccess, hasService } = useCurrentProject();
  const { isAdmin } = useCurrentUser();

  const canManageProject = isAdmin || currentAccess?.canManageProject === true;
  const projectMainNav: NavItem[] = canManageProject
    ? [
        ...projectMainNavBase,
        { href: "/dashboard/recycle-bin", label: "Recycle Bin", icon: Trash2 },
      ]
    : projectMainNavBase;

  const visibleProjectMainNav = projectMainNav.filter(
    (item) => !item.feature || hasService(item.feature),
  );
  const visibleCmsNav = cmsNav.filter(
    (item) => !item.feature || hasService(item.feature),
  );

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
            {mode === "admin" ? "A" : "D"}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {mode === "admin" ? "Platform Admin" : "Project Dashboard"}
            </p>
            <p className="text-xs text-muted-foreground">
              {mode === "admin"
                ? "System Core"
                : (currentProject?.name ?? "No Project")}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="scrollbar-hide gap-0 p-2">
        {mode === "admin" ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {platformNav.map((item) => {
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
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-wider">
                Main
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleProjectMainNav.map((item) => {
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
                Content & Settings
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleCmsNav.map((item) => {
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
          </>
        )}
      </SidebarContent>
      {mode === "dashboard" && isAdmin && (
        <div className="mt-auto p-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-[10px] uppercase tracking-widest font-bold h-8"
          >
            <Link href="/admin">Return to admin</Link>
          </Button>
        </div>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
