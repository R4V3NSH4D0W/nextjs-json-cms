"use client";

import { Badge } from "@/components/ui/badge";
import {
  SECTION_TOOLS,
  TYPE_SHORT,
  type SectionBlockType,
} from "@/lib/cms/layout-builder";

export function LayoutBuilderBlockTypeBadge({ type }: { type: SectionBlockType }) {
  const tool = SECTION_TOOLS.find((t) => t.id === type);
  const variant =
    tool?.group === "structure"
      ? "default"
      : tool?.group === "primitive"
        ? "secondary"
        : "outline";
  return (
    <Badge
      variant={variant}
      className="min-w-[2.25rem] shrink-0 justify-center px-1.5 font-mono text-[10px] tabular-nums"
    >
      {TYPE_SHORT[type]}
    </Badge>
  );
}

export function LayoutBuilderBlockTypeIcon({ type }: { type: SectionBlockType }) {
  const tool = SECTION_TOOLS.find((t) => t.id === type);
  if (!tool) return null;
  const Icon = tool.icon;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}
