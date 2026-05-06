"use client";

import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared/utils";

type CmsEditorHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  className?: string;
};

export function CmsEditorHeader({
  icon: Icon,
  title,
  description,
  badge,
  className,
}: CmsEditorHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-gradient-to-b from-background to-muted/20 px-4 py-4 sm:px-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground">
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
    </section>
  );
}
