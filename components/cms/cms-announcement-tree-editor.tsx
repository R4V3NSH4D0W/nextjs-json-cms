"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared/utils";
import {
  createAnnouncementNode,
  type CmsAnnouncementNode,
} from "@/lib/cms/site-content-types";

function patchItem(
  items: CmsAnnouncementNode[],
  index: number,
  patch: Partial<CmsAnnouncementNode>
): CmsAnnouncementNode[] {
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

export function CmsAnnouncementTreeEditor({
  items,
  onChange,
  depth = 0,
}: {
  items: CmsAnnouncementNode[];
  onChange: (next: CmsAnnouncementNode[]) => void;
  depth?: number;
}) {
  function addSibling() {
    onChange([...items, createAnnouncementNode()]);
  }

  return (
    <div className={cn("space-y-4", depth > 0 && "border-l-2 border-muted pl-3")}>
      {items.map((item, i) => (
        <div key={item.id} className="space-y-3 rounded-lg border bg-card/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={item.title}
                onChange={(e) =>
                  onChange(patchItem(items, i, { title: e.target.value }))
                }
                placeholder="Free shipping this week"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Body</Label>
              <Textarea
                value={item.body}
                onChange={(e) =>
                  onChange(patchItem(items, i, { body: e.target.value }))
                }
                placeholder="Short message shown in the banner…"
                rows={3}
                className="min-h-[4rem] resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link (optional)</Label>
              <Input
                value={item.href ?? ""}
                onChange={(e) =>
                  onChange(
                    patchItem(items, i, {
                      href: e.target.value.trim() || undefined,
                    })
                  )
                }
                placeholder="/sale"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${item.id}-active`}
                checked={item.isActive !== false}
                onCheckedChange={(c) =>
                  onChange(patchItem(items, i, { isActive: c === true }))
                }
              />
              <Label
                htmlFor={`${item.id}-active`}
                className="text-xs font-normal text-muted-foreground"
              >
                Active
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${item.id}-dis`}
                checked={item.dismissible !== false}
                onCheckedChange={(c) =>
                  onChange(patchItem(items, i, { dismissible: c === true }))
                }
              />
              <Label
                htmlFor={`${item.id}-dis`}
                className="text-xs font-normal text-muted-foreground"
              >
                Dismissible
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${item.id}-tab`}
                checked={item.openInNewTab === true}
                onCheckedChange={(c) =>
                  onChange(patchItem(items, i, { openInNewTab: c === true }))
                }
              />
              <Label
                htmlFor={`${item.id}-tab`}
                className="text-xs font-normal text-muted-foreground"
              >
                Open link in new tab
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
                onClick={() => onChange(arrayMove(items, i, i - 1))}
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
                onClick={() => onChange(arrayMove(items, i, i + 1))}
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
                      children: [...item.children, createAnnouncementNode()],
                    })
                  )
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Nested
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
            <CmsAnnouncementTreeEditor
              depth={depth + 1}
              items={item.children}
              onChange={(c) =>
                onChange(patchItem(items, i, { children: c }))
              }
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
        {depth === 0 ? "Add announcement" : "Add sibling"}
      </Button>
    </div>
  );
}
