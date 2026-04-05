import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Images,
  LayoutTemplate,
  Megaphone,
  Menu,
  PanelBottom,
} from "lucide-react";

import { cn } from "@/lib/shared/utils";

const items = [
  {
    title: "Pages",
    description: "Pages, blocks, and SEO",
    href: "/dashboard/cms/pages",
    icon: FileText,
  },
  {
    title: "Layouts",
    description: "Reusable section schemas",
    href: "/dashboard/cms/layouts",
    icon: LayoutTemplate,
  },
  {
    title: "Navigation",
    description: "Header menus and links",
    href: "/dashboard/cms/navigation",
    icon: Menu,
  },
  {
    title: "Footer",
    description: "Columns and link groups",
    href: "/dashboard/cms/footer",
    icon: PanelBottom,
  },
  {
    title: "Announcements",
    description: "Banners and alerts",
    href: "/dashboard/cms/announcements",
    icon: Megaphone,
  },
  {
    title: "Media",
    description: "Image library and folders",
    href: "/dashboard/media",
    icon: Images,
  },
] as const;

export default function CmsHubPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8 border-b border-border pb-8">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Storefront CMS
        </p>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Content
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Edit what visitors see on the site — pages, layouts, and global chrome.
          Upload and organize images in Media, or pick from the library while
          editing layouts.
        </p>
      </header>

      <ul className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="bg-background">
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 px-4 py-4 transition-colors",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                )}
              >
                <span
                  className="text-muted-foreground group-hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
