"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GROUP_LABEL,
  SECTION_TOOLS,
  type SectionBlockType,
  type SectionTool,
} from "@/lib/cms/layout-builder";

export function LayoutBuilderGroupedToolPalette({
  onPick,
}: {
  onPick: (type: SectionBlockType) => void;
}) {
  const groups: SectionTool["group"][] = ["content", "primitive", "structure"];

  return (
    <div className="space-y-3">
      {groups.map((group, i) => (
        <div key={group}>
          {i > 0 && <Separator className="mb-3" />}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {GROUP_LABEL[group]}
          </p>
          <div className="flex flex-wrap gap-2">
            {SECTION_TOOLS.filter((t) => t.group === group).map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-normal"
                  onClick={() => onPick(tool.id)}
                  title={tool.description}
                >
                  {tool.id === "icon" ? (
                    <span className="flex items-center gap-0.5" aria-hidden>
                      <Icon className="h-3.5 w-3.5 opacity-80" />
                      <Sparkles className="h-3 w-3 opacity-70" />
                    </span>
                  ) : (
                    <Icon className="h-3.5 w-3.5 opacity-80" />
                  )}
                  {tool.name}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
