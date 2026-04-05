"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CmsLinkTreeEditor } from "@/components/cms/cms-link-tree-editor";
import {
  createFooterColumn,
  type CmsFooterColumn,
  type CmsFooterConfig,
} from "@/lib/cms/site-content-types";

export function CmsFooterEditor({
  value,
  onChange,
}: {
  value: CmsFooterConfig;
  onChange: (next: CmsFooterConfig) => void;
}) {
  const columns = value.columns;

  function patchColumn(index: number, patch: Partial<CmsFooterColumn>) {
    const next = value.columns.map((c, j) =>
      j === index ? { ...c, ...patch } : c
    );
    onChange({ ...value, columns: next });
  }

  function removeColumn(index: number) {
    onChange({
      ...value,
      columns: value.columns.filter((_, i) => i !== index),
    });
  }

  function addColumn() {
    onChange({
      ...value,
      columns: [...value.columns, createFooterColumn({ title: "Column" })],
    });
  }

  return (
    <div className="space-y-6">
      {columns.map((col, i) => (
        <div
          key={col.id}
          className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs">Column title</Label>
              <Input
                value={col.title}
                onChange={(e) => patchColumn(i, { title: e.target.value })}
                placeholder="Shop"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={i === 0}
                aria-label="Move column up"
                onClick={() =>
                  onChange({
                    ...value,
                    columns: arrayMove(value.columns, i, i - 1),
                  })
                }
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={i >= columns.length - 1}
                aria-label="Move column down"
                onClick={() =>
                  onChange({
                    ...value,
                    columns: arrayMove(value.columns, i, i + 1),
                  })
                }
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeColumn(i)}
              >
                <Trash2 className="h-4 w-4" />
                Remove column
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Links (nested groups supported)
            </p>
            <CmsLinkTreeEditor
              items={col.links}
              onChange={(links) => patchColumn(i, { links })}
              addRootLabel="Add link"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" className="gap-1" onClick={addColumn}>
        <Plus className="h-4 w-4" />
        Add column
      </Button>
    </div>
  );
}
