"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LayoutConfigForm } from "@/components/cms/layout-config-form";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCmsCollections,
  useCmsCollectionItems,
  useCreateCmsCollectionItem,
  useDeleteCmsCollectionItem,
  useUpdateCmsCollectionItem,
} from "@/hooks/use-cms";
import { absoluteApiUrl, absoluteTenantApiUrl } from "@/lib/cms/absolute-url";
import { type CmsCollectionItem, cmsApi } from "@/lib/cms/api";
import {
  findCollectionItemPreviewImage,
  titleFromImageUrl,
  type CmsCollectionItemPreviewImage,
} from "@/lib/cms/collection-item-image";
import { publicCmsCollectionApiPath } from "@/lib/cms/public-site-api-paths";
import { parseFieldDefs, type LayoutFieldDef } from "@/lib/cms/layout-payload";

function defaultLeafValue(def: LayoutFieldDef): unknown {
  if (def.default !== undefined) return def.default;
  switch (def.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "link":
      return { value: "", href: "", target: "_self" };
    case "collection_ref":
      return def.multiple === false ? "" : [];
    default:
      return "";
  }
}

function buildDefaults(defs: LayoutFieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    const key = def.key?.trim();
    if (!key) continue;
    if (def.type === "object") {
      out[key] = buildDefaults(def.fields ?? []);
      continue;
    }
    if (def.type === "array") {
      out[key] = [buildDefaults(def.fields ?? [])];
      continue;
    }
    out[key] = defaultLeafValue(def);
  }
  return out;
}

function deriveTitleFromPayload(payload: Record<string, unknown>, fallbackKey: string): string {
  const preferred = ["title", "name", "label", "heading"];
  for (const key of preferred) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const previewImage = findCollectionItemPreviewImage(payload);
  if (previewImage) {
    const imageTitle = titleFromImageUrl(previewImage.url);
    if (imageTitle) return imageTitle;
  }
  for (const value of Object.values(payload)) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return `${fallbackKey} item`;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(input: string, max = 96): string {
  return input.length <= max ? input : `${input.slice(0, max - 1)}…`;
}

function previewTextForValue(type: string, value: unknown): string {
  if (value == null) return "";
  if (type === "description" && typeof value === "string") {
    return truncate(stripHtml(value));
  }
  if (type === "boolean") {
    return value === true ? "Yes" : value === false ? "No" : "";
  }
  if (type === "link" && typeof value === "object" && !Array.isArray(value)) {
    const link = value as Record<string, unknown>;
    const label = typeof link.value === "string" ? link.value.trim() : "";
    const href = typeof link.href === "string" ? link.href.trim() : "";
    return truncate(label || href);
  }
  if (type === "collection_ref") {
    if (Array.isArray(value)) return `${value.length} linked`;
    if (typeof value === "string" && value.trim()) return truncate(value);
    return "";
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    return truncate(JSON.stringify(value));
  }
  return truncate(String(value));
}

function buildPreviewRows(
  defs: LayoutFieldDef[],
  payload: Record<string, unknown>,
  maxRows = 5,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  const walk = (innerDefs: LayoutFieldDef[], current: Record<string, unknown>) => {
    for (const def of innerDefs) {
      if (rows.length >= maxRows) return;
      const key = def.key?.trim();
      if (!key) continue;
      const value = current[key];
      if (def.type === "object") {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          walk(def.fields ?? [], value as Record<string, unknown>);
        }
        continue;
      }
      if (def.type === "array") {
        if (Array.isArray(value)) {
          rows.push({
            label: key,
            value: `${value.length} item${value.length === 1 ? "" : "s"}`,
          });
        }
        continue;
      }
      const text = previewTextForValue(def.type, value);
      if (text) rows.push({ label: key, value: text });
    }
  };

  walk(defs, payload);
  if (rows.length > 0) return rows;

  for (const [key, raw] of Object.entries(payload)) {
    if (rows.length >= maxRows) break;
    const text = previewTextForValue("", raw);
    if (!text) continue;
    rows.push({ label: key, value: text });
  }

  return rows;
}

function SortableCollectionCard({
  item,
  previewImage,
  previewRows,
  onEdit,
  onDelete,
  isBusy,
}: {
  item: CmsCollectionItem;
  previewImage: CmsCollectionItemPreviewImage | null;
  previewRows: Array<{ label: string; value: string }>;
  onEdit: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isDragging ? "z-10 ring-1 ring-primary/40" : ""}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{item.title}</CardTitle>
          <button
            type="button"
            className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Drag to reorder item"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {previewImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <Image
              src={absoluteApiUrl(previewImage.url)}
              alt={item.title}
              fill
              className="object-cover object-center"
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
            />
          </div>
        ) : null}
        {previewRows.length > 0 ? (
          <div className="rounded-md border bg-muted/30 p-2">
            {previewRows.map((row) => (
              <div key={`${item.id}-${row.label}`} className="py-1 text-xs">
                <span className="text-muted-foreground">{row.label}: </span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        ) : previewImage ? null : (
          <p className="text-xs text-muted-foreground">No previewable fields.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDelete} disabled={isBusy}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CmsCollectionItemsPage() {
  const params = useParams<{ key: string }>();
  const collectionKey = decodeURIComponent(params.key ?? "").trim().toLowerCase();
  const queryClient = useQueryClient();
  const { currentProject } = useCurrentProject();
  const { data: defsRes } = useCmsCollections();
  const pageSize = 50;
  const offset = 0;

  const { data, isLoading } = useCmsCollectionItems(collectionKey, {
    includeInactive: true,
    includeDraft: true,
    sort: "displayOrderAsc",
    limit: pageSize,
    offset,
    enabled: !!collectionKey,
  });
  const createItem = useCreateCmsCollectionItem(collectionKey);
  const updateItem = useUpdateCmsCollectionItem(collectionKey);
  const deleteItem = useDeleteCmsCollectionItem(collectionKey);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const collectionDefinition = useMemo(
    () => (defsRes?.collections ?? []).find((c) => c.key === collectionKey),
    [defsRes?.collections, collectionKey],
  );
  const schemaDefs = useMemo(() => {
    const schema = collectionDefinition?.schema;
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) return [];
    const obj = schema as Record<string, unknown>;
    if (Array.isArray(obj.fields)) return parseFieldDefs(obj.fields);
    const rootKeys = Object.keys(obj);
    if (rootKeys.length > 0 && Array.isArray(obj[rootKeys[0] ?? ""])) {
      return parseFieldDefs(obj[rootKeys[0] ?? ""]);
    }
    return [];
  }, [collectionDefinition?.schema]);
  const schemaDefaults = useMemo(() => buildDefaults(schemaDefs), [schemaDefs]);
  const useVisualSchemaForm = schemaDefs.length > 0;
  const [isReordering, setIsReordering] = useState(false);
  const [orderedItems, setOrderedItems] = useState<CmsCollectionItem[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsCollectionItem | null>(
    null,
  );
  const [payloadText, setPayloadText] = useState("{}");
  const [payloadValue, setPayloadValue] = useState<Record<string, unknown>>({});
  const [published, setPublished] = useState(true);
  const [active, setActive] = useState(true);
  const publicApiPath = publicCmsCollectionApiPath(collectionKey);
  const publicApiUrl = absoluteTenantApiUrl(publicApiPath, {
    slug: currentProject?.slug,
    primaryDomain: currentProject?.primaryDomain,
  });

  useEffect(() => {
    if (!editingId) {
      setPayloadValue(schemaDefaults);
    }
  }, [editingId, schemaDefaults]);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  function resetForm() {
    setEditingId(null);
    setPayloadText("{}");
    setPayloadValue(schemaDefaults);
    setPublished(true);
    setActive(true);
  }

  function loadItemForEdit(item: (typeof items)[number]) {
    const payload = (item.payload ?? {}) as Record<string, unknown>;
    setEditingId(item.id);
    setPayloadText(JSON.stringify(payload, null, 2));
    setPayloadValue(payload);
    setPublished(item.published);
    setActive(item.isActive);
  }

  function parsePayloadOrThrow() {
    try {
      const raw = JSON.parse(payloadText || "{}");
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error("Payload must be a JSON object");
      }
      return raw as Record<string, unknown>;
    } catch {
      throw new Error("Payload JSON is invalid");
    }
  }

  async function handleSave() {
    let payload: Record<string, unknown> = payloadValue;
    if (!useVisualSchemaForm) {
      try {
        payload = parsePayloadOrThrow();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invalid payload");
        return;
      }
    }
    const resolvedTitle = deriveTitleFromPayload(payload, collectionKey);

    if (editingId) {
      await updateItem.mutateAsync({
        id: editingId,
        data: {
          title: resolvedTitle,
          slug: null,
          payload,
          published,
          isActive: active,
        },
      });
      resetForm();
      return;
    }

    await createItem.mutateAsync({
      title: resolvedTitle,
      payload,
      published,
      isActive: active,
    });
    resetForm();
  }

  async function persistOrder(nextItems: CmsCollectionItem[]) {
    if (!currentProject) return;
    setIsReordering(true);
    try {
      const updates = nextItems
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => item.displayOrder !== offset + index)
        .map(({ item, index }) =>
          cmsApi.updateCollectionItem(currentProject.slug, collectionKey, item.id, {
            displayOrder: offset + index,
          }),
        );
      if (updates.length > 0) {
        await Promise.all(updates);
      }
      await queryClient.invalidateQueries({
        queryKey: ["cms-collections", currentProject.slug, collectionKey],
      });
    } finally {
      setIsReordering(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedItems.findIndex((item) => item.id === String(active.id));
    const newIndex = orderedItems.findIndex((item) => item.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(next);
    void persistOrder(next);
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
      <AlertDialog
        open={deleteTarget !== null}
        title={
          deleteTarget
            ? `Delete collection item "${deleteTarget.title}"?`
            : "Delete collection item?"
        }
        description="This removes the item from the collection API and CMS item list."
        confirmLabel="Delete item"
        confirmationText={deleteTarget?.title}
        confirmationLabel="Type the item title to confirm."
        destructive
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={
          deleteTarget
            ? async () => {
                await deleteItem.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
              }
            : undefined
        }
      />
      <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
        <Link href="/dashboard/cms/collections">← All collections</Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Collection: {collectionKey}</h1>
        <p className="text-sm text-muted-foreground">
          Add and manage data entries inside this collection.
        </p>
        <div className="mt-2 rounded-md border bg-muted/30 p-3 font-mono text-xs">
          <p className="font-sans text-xs text-muted-foreground">Public API</p>
          <p>{publicApiUrl}?limit=10&amp;offset=0</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Edit item" : "New item"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>
                {useVisualSchemaForm ? "Collection fields" : "Payload (JSON object)"}
              </Label>
              {useVisualSchemaForm ? (
                <div className="rounded-md border p-3">
                  <LayoutConfigForm
                    rootKey="item"
                    defs={schemaDefs}
                    value={{ item: payloadValue }}
                    onChange={(next) => {
                      const itemValue = next.item;
                      if (
                        itemValue &&
                        typeof itemValue === "object" &&
                        !Array.isArray(itemValue)
                      ) {
                        setPayloadValue(itemValue as Record<string, unknown>);
                      } else {
                        setPayloadValue({});
                      }
                    }}
                    showRootKeyHint={false}
                  />
                </div>
              ) : (
                <Textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              )}
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={published} onCheckedChange={setPublished} />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={active} onCheckedChange={setActive} />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={createItem.isPending || updateItem.isPending}
            >
              {createItem.isPending || updateItem.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Save changes" : "Create item"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading items…
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No collection items yet.</p>
        ) : (
          <div className="rounded-lg border bg-muted/20 p-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {orderedItems.map((item) => {
            const payload =
              item.payload && typeof item.payload === "object" && !Array.isArray(item.payload)
                ? (item.payload as Record<string, unknown>)
                : {};
            const previewRows = buildPreviewRows(schemaDefs, payload);
            const previewImage = findCollectionItemPreviewImage(payload);
            return (
              <SortableCollectionCard
                key={item.id}
                item={item}
                previewImage={previewImage}
                previewRows={previewRows}
                onEdit={() => loadItemForEdit(item)}
                onDelete={() => setDeleteTarget(item)}
                isBusy={isReordering || deleteItem.isPending}
              />
            );
          })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
