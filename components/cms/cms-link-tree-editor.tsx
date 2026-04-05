"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/shared/utils";
import { createLinkNode, type CmsLinkNode } from "@/lib/cms/site-content-types";

function patchItem(
  items: CmsLinkNode[],
  index: number,
  patch: Partial<CmsLinkNode>
): CmsLinkNode[] {
  const next = [...items];
  const cur = next[index];
  if (!cur) return items;
  next[index] = {
    ...cur,
    ...patch,
    children: patch.children ?? cur.children,
  };
  return next;
}

export function CmsLinkTreeEditor({
  items,
  onChange,
  depth = 0,
  addRootLabel = "Add link",
}: {
  items: CmsLinkNode[];
  onChange: (next: CmsLinkNode[]) => void;
  depth?: number;
  /** Label for the root-level add button */
  addRootLabel?: string;
}) {
  function addSibling() {
    onChange([...items, createLinkNode()]);
  }

  return (
    <div className={cn("space-y-4", depth > 0 && "border-l-2 border-muted pl-3")}>
      {items.map((item, i) => (
        <div key={item.id} className="space-y-3 rounded-lg border bg-card/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={item.label}
                onChange={(e) =>
                  onChange(patchItem(items, i, { label: e.target.value }))
                }
                placeholder="Shop"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL</Label>
              <Input
                value={item.href}
                onChange={(e) =>
                  onChange(patchItem(items, i, { href: e.target.value }))
                }
                placeholder="/collections/all"
                spellCheck={false}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${item.id}-tab`}
                checked={item.openInNewTab === true}
                onCheckedChange={(c) =>
                  onChange(
                    patchItem(items, i, { openInNewTab: c === true })
                  )
                }
              />
              <Label
                htmlFor={`${item.id}-tab`}
                className="text-xs font-normal text-muted-foreground"
              >
                Open in new tab
              </Label>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={i === 0}
                aria-label="Move up"
                onClick={() =>
                  onChange(arrayMove(items, i, i - 1))
                }
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={i >= items.length - 1}
                aria-label="Move down"
                onClick={() =>
                  onChange(arrayMove(items, i, i + 1))
                }
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1"
                onClick={() =>
                  onChange(
                    patchItem(items, i, {
                      children: [...item.children, createLinkNode()],
                    })
                  )
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Child
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() =>
                  onChange(items.filter((_, j) => j !== i))
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {item.children.length > 0 ? (
            <CmsLinkTreeEditor
              depth={depth + 1}
              items={item.children}
              onChange={(c) =>
                onChange(patchItem(items, i, { children: c }))
              }
              addRootLabel="Add nested link"
            />
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={addSibling}
      >
        <Plus className="h-3.5 w-3.5" />
        {depth === 0 ? addRootLabel : "Add sibling"}
      </Button>
    </div>
  );
}
