"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { Hammer, Loader2 } from "lucide-react";
import {
  useCmsCustomTool,
  useCmsCustomTools,
  useCreateCmsCustomTool,
  useUpdateCmsCustomTool,
} from "@/hooks/use-cms";
import type { CmsCustomTool, CmsCustomToolDefinition } from "@/lib/cms/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addChildToContainer,
  addCustomChildToContainer,
  createBlock,
  createBlockFromCustomTool,
  sanitizeSectionRootKeyInput,
  moveBlockSibling,
  removeBlockById,
  reorderBlockSiblings,
  siblingKeysFrom,
  updateBlockDefault,
  updateBlockDefaultLink,
  updateBlockKey,
  updateBlockRequired,
  type SectionBlock,
  type SectionBlockType,
} from "@/lib/cms/layout-builder";
import { LayoutBuilderBlockBranch } from "@/components/cms/layout-builder/block-branch";
import { LayoutBuilderGroupedToolPalette } from "@/components/cms/layout-builder/grouped-tool-palette";
import { toast } from "sonner";

function blockToDefinition(block: SectionBlock): CmsCustomToolDefinition {
  const base: CmsCustomToolDefinition = {
    type: block.type,
    key: block.key,
    ...(block.required ? { required: true } : {}),
  };
  if (block.type === "link") {
    return {
      ...base,
      ...(block.defaultLink ? { defaultLink: block.defaultLink } : {}),
    };
  }
  if (block.type === "array" || block.type === "object") {
    return {
      ...base,
      children: block.children.map(blockToDefinition),
    };
  }
  return {
    ...base,
    ...(block.defaultStr !== undefined ? { defaultStr: block.defaultStr } : {}),
  };
}

function initialStateFromTool(tool?: CmsCustomTool) {
  if (!tool) {
    return {
      name: "",
      description: "",
      toolKey: "",
      blocks: [] as SectionBlock[],
    };
  }

  if (tool.definition.type === "object" && Array.isArray(tool.definition.children)) {
    const siblings = new Set<string>();
    const blocks = tool.definition.children.map((child) => {
      const node = createBlockFromCustomTool(child, 0, siblings);
      siblings.add(node.key.trim());
      return node;
    });
    return {
      name: tool.name,
      description: tool.description ?? "",
      toolKey:
        typeof tool.definition.key === "string" && tool.definition.key.trim()
          ? tool.definition.key.trim()
          : sanitizeSectionRootKeyInput(tool.name) || "group",
      blocks,
    };
  }

  return {
    name: tool.name,
    description: tool.description ?? "",
    toolKey: sanitizeSectionRootKeyInput(tool.name) || "group",
    blocks: [createBlockFromCustomTool(tool.definition, 0, new Set<string>())],
  };
}

function CmsToolBuilderForm({
  toolId,
  initialTool,
}: {
  toolId?: string;
  initialTool?: CmsCustomTool;
}) {
  const isEdit = Boolean(toolId);
  const { data: allToolsData } = useCmsCustomTools();
  const createTool = useCreateCmsCustomTool();
  const updateTool = useUpdateCmsCustomTool();

  const initialState = useMemo(() => initialStateFromTool(initialTool), [initialTool]);
  const [name, setName] = useState(initialState.name);
  const [toolKey, setToolKey] = useState(initialState.toolKey);
  const [description, setDescription] = useState(initialState.description);
  const [blocks, setBlocks] = useState<SectionBlock[]>(initialState.blocks);

  const isSaving = createTool.isPending || updateTool.isPending;
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const sortedTools = useMemo(
    () =>
      [...(allToolsData?.tools ?? [])].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [allToolsData?.tools],
  );

  const addRoot = useCallback((type: SectionBlockType) => {
    setBlocks((prev) => {
      const keys = siblingKeysFrom(prev);
      return [...prev, createBlock(type, 0, keys)];
    });
  }, []);

  const addCustomRoot = useCallback((tool: CmsCustomTool) => {
    setBlocks((prev) => {
      const keys = siblingKeysFrom(prev);
      try {
        return [...prev, createBlockFromCustomTool(tool.definition, 0, keys)];
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Tool "${tool.name}" is invalid: ${error.message}`
            : `Tool "${tool.name}" is invalid.`,
        );
        return prev;
      }
    });
  }, []);

  const addIntoContainer = useCallback(
    (containerId: string, type: SectionBlockType, childDepth: number) => {
      setBlocks((prev) => addChildToContainer(prev, containerId, type, childDepth));
    },
    [],
  );

  const addCustomIntoContainer = useCallback(
    (containerId: string, tool: CmsCustomTool, childDepth: number) => {
      setBlocks((prev) => {
        try {
          return addCustomChildToContainer(
            prev,
            containerId,
            tool.definition,
            childDepth,
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? `Tool "${tool.name}" is invalid: ${error.message}`
              : `Tool "${tool.name}" is invalid.`,
          );
          return prev;
        }
      });
    },
    [],
  );

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => removeBlockById(prev, id));
  }, []);

  const setBlockKey = useCallback((id: string, key: string) => {
    setBlocks((prev) => updateBlockKey(prev, id, key));
  }, []);

  const setBlockDefault = useCallback((id: string, value: string | undefined) => {
    setBlocks((prev) => updateBlockDefault(prev, id, value));
  }, []);

  const setBlockDefaultLink = useCallback(
    (id: string, value: { value: string; href: string; target: string }) => {
      setBlocks((prev) => updateBlockDefaultLink(prev, id, value));
    },
    [],
  );

  const setBlockRequired = useCallback((id: string, required: boolean) => {
    setBlocks((prev) => updateBlockRequired(prev, id, required));
  }, []);

  const moveBlock = useCallback((id: string, direction: "up" | "down") => {
    setBlocks((prev) => moveBlockSibling(prev, id, direction));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((prev) =>
      reorderBlockSiblings(prev, String(active.id), String(over.id)),
    );
  }, []);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Tool name is required.");
      return;
    }
    if (blocks.length === 0) {
      toast.error("Add at least one field to the tool.");
      return;
    }
    const key = sanitizeSectionRootKeyInput(toolKey || name) || "group";
    const definition: CmsCustomToolDefinition = {
      type: "object",
      key,
      children: blocks.map(blockToDefinition),
    };

    if (isEdit && toolId) {
      await updateTool.mutateAsync({
        id: toolId,
        data: {
          name: trimmedName,
          description: description.trim() || null,
          definition,
        },
      });
      return;
    }

    const res = await createTool.mutateAsync({
      name: trimmedName,
      description: description.trim() || null,
      definition,
    });
    window.location.href = `/dashboard/cms/tools/${res.tool.id}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/dashboard/cms/tools">← Tools</Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hammer className="h-6 w-6 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Tool" : "Create Tool"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Build grouped reusable fields like{" "}
          <span className="font-mono">{`{ ${toolKey || "group"}: { ... } }`}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                if (!isEdit && toolKey.trim().length === 0) {
                  setToolKey(sanitizeSectionRootKeyInput(nextName));
                }
              }}
              placeholder="e.g. Hero section"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Group key
            </label>
            <Input
              value={toolKey}
              onChange={(e) =>
                setToolKey(sanitizeSectionRootKeyInput(e.target.value))
              }
              placeholder="hero_section"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown in palette tooltip"
            />
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-xs font-medium text-muted-foreground">Add fields</p>
            <LayoutBuilderGroupedToolPalette
              onPick={addRoot}
              customTools={sortedTools}
              onPickCustom={addCustomRoot}
            />
          </div>

          {blocks.length > 0 ? (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">Group fields</p>
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {blocks.map((block, index) => (
                      <LayoutBuilderBlockBranch
                        key={block.id}
                        block={block}
                        depth={0}
                        siblingIndex={index}
                        siblingCount={blocks.length}
                        duplicateKey={false}
                        onRemove={removeBlock}
                        onAddIntoContainer={addIntoContainer}
                        onAddCustomIntoContainer={addCustomIntoContainer}
                        onKeyChange={setBlockKey}
                        onDefaultChange={setBlockDefault}
                        onDefaultLinkChange={setBlockDefaultLink}
                        onRequiredChange={setBlockRequired}
                        onMoveBlock={moveBlock}
                        customTools={sortedTools}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="rounded-md border border-dashed px-3 py-4 text-xs text-muted-foreground">
              Add fields to define this reusable grouped tool.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create tool"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CmsToolBuilder({ toolId }: { toolId?: string }) {
  const isEdit = Boolean(toolId);
  const toolQuery = useCmsCustomTool(toolId ?? "");

  if (isEdit && toolQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading tool…
      </div>
    );
  }

  if (isEdit && toolQuery.isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {toolQuery.error instanceof Error
          ? toolQuery.error.message
          : "Failed to load tool."}
      </div>
    );
  }

  return (
    <CmsToolBuilderForm
      key={toolQuery.data?.tool?.id ?? "new"}
      toolId={toolId}
      initialTool={toolQuery.data?.tool}
    />
  );
}
