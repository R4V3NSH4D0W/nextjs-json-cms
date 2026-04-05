"use client";

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CmsHtmlDescriptionEditor } from "@/components/cms/cms-html-description-editor";
import {
  type LayoutFieldDef,
  emptyArrayItemFromFields,
  shouldFlattenArrayItemLinks,
} from "@/lib/cms/layout-payload";
import { cn } from "@/lib/shared/utils";
import { CmsReferenceScreenshotField } from "@/components/cms/cms-reference-screenshot-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function newSortRowId(): string {
  return crypto.randomUUID();
}

function reorderRecordByFieldIndices(
  inner: Record<string, unknown>,
  fields: LayoutFieldDef[],
  orderedIndices: number[],
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  const seen = new Set<string>();
  for (const i of orderedIndices) {
    const field = fields[i];
    const key = field?.key?.trim();
    if (!key) continue;
    seen.add(key);
    if (Object.prototype.hasOwnProperty.call(inner, key)) {
      next[key] = inner[key];
    }
  }
  for (const k of Object.keys(inner)) {
    if (!seen.has(k)) next[k] = inner[k];
  }
  return next;
}

function useRowIdsSyncedToLength(itemCount: number): [
  string[],
  Dispatch<SetStateAction<string[]>>,
] {
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length: itemCount }, () => newSortRowId()),
  );

  useEffect(() => {
    setIds((prev) => {
      if (prev.length === itemCount) return prev;
      if (itemCount > prev.length) {
        const extra = Array.from(
          { length: itemCount - prev.length },
          () => newSortRowId(),
        );
        return [...prev, ...extra];
      }
      return prev.slice(0, itemCount);
    });
  }, [itemCount]);

  return [ids, setIds];
}

function fieldLabel(key: string, type: string): string {
  return `${key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} (${type})`;
}

function FieldLabelLine({
  htmlFor,
  def,
}: {
  htmlFor: string;
  def: LayoutFieldDef;
}) {
  const text = fieldLabel(def.key, def.type);
  return (
    <Label htmlFor={htmlFor} className="break-words">
      {text}
      {def.required ? (
        <span className="text-destructive" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
      {def.required ? <span className="sr-only"> (required)</span> : null}
    </Label>
  );
}

function FieldGroup({
  defs,
  value,
  onChange,
  depth = 0,
  isArrayItemFieldGroup = false,
  expandAllSignal = 0,
  collapseAllSignal = 0,
}: {
  defs: LayoutFieldDef[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  depth?: number;
  /** True when this group is the direct fields of one array element (not nested object inside it). */
  isArrayItemFieldGroup?: boolean;
  /** Increment to expand nested object/array groups. */
  expandAllSignal?: number;
  /** Increment to collapse nested object/array groups. */
  collapseAllSignal?: number;
}) {
  const flattenArrayItemLinks =
    isArrayItemFieldGroup && shouldFlattenArrayItemLinks(defs);

  return (
    <div
      className={cn(
        "min-w-0 space-y-4",
        depth > 0 && "border-l-2 border-muted pl-3",
      )}
    >
      {defs.map((def, index) => (
        <FieldRow
          key={`${def.key}-${def.type}-${index}`}
          def={def}
          value={value}
          onChange={onChange}
          depth={depth}
          flattenArrayItemLinks={flattenArrayItemLinks}
          expandAllSignal={expandAllSignal}
          collapseAllSignal={collapseAllSignal}
        />
      ))}
    </div>
  );
}

function SortableArrayItem({
  id,
  index,
  item,
  def,
  depth,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onMoveUp,
  onMoveDown,
  onChange,
  expandAllSignal,
  collapseAllSignal,
  itemsCount,
}: {
  id: string;
  index: number;
  item: Record<string, unknown>;
  def: LayoutFieldDef;
  depth: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onChange: (next: Record<string, unknown>) => void;
  expandAllSignal: number;
  collapseAllSignal: number;
  itemsCount: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-0 rounded-md border border-dashed bg-muted/30 p-3",
        isDragging && "z-10 bg-muted opacity-50 ring-2 ring-primary/20",
      )}
    >
      <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="min-w-0 flex-1 break-words text-xs font-medium uppercase text-muted-foreground">
            Item {index + 1}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-2 flex items-center border-r pr-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onMoveUp}
              disabled={index === 0}
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={onMoveDown}
              disabled={index === itemsCount - 1}
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 text-xs"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            {isCollapsed ? "Expand" : "Collapse"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Minus className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>
      {isCollapsed ? (
        <p className="text-xs text-muted-foreground">Item collapsed.</p>
      ) : (
        <FieldGroup
          defs={def.fields ?? []}
          value={item}
          onChange={onChange}
          depth={depth + 1}
          isArrayItemFieldGroup
          expandAllSignal={expandAllSignal}
          collapseAllSignal={collapseAllSignal}
        />
      )}
    </li>
  );
}

function SortableObjectFieldRow({
  id,
  position,
  itemsCount,
  onMoveUp,
  onMoveDown,
  children,
}: {
  id: string;
  position: number;
  itemsCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-0 list-none rounded-md border border-dashed border-muted/60 bg-muted/20 p-2",
        isDragging && "z-10 opacity-60 ring-2 ring-primary/20",
      )}
    >
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1 border-b border-border/60 pb-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder field"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
          Field {position + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onMoveUp}
          disabled={position === 0}
          title="Move field up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onMoveDown}
          disabled={position === itemsCount - 1}
          title="Move field down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="min-w-0 pl-1">{children}</div>
    </li>
  );
}

function ObjectFieldEditor({
  def,
  value,
  onChange,
  depth,
  flattenArrayItemLinks,
  expandAllSignal,
  collapseAllSignal,
}: {
  def: LayoutFieldDef;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  depth: number;
  flattenArrayItemLinks: boolean;
  expandAllSignal: number;
  collapseAllSignal: number;
}) {
  const fields = def.fields ?? [];
  const fieldsSig = fields.map((f) => f.key).join("\0");
  const [isObjectExpanded, setIsObjectExpanded] = useState(true);
  const [fieldOrder, setFieldOrder] = useState<number[]>(() =>
    fields.map((_, i) => i),
  );

  useEffect(() => {
    setFieldOrder(fields.map((_, i) => i));
  }, [fieldsSig]);

  useEffect(() => {
    if (expandAllSignal <= 0) return;
    setIsObjectExpanded(true);
  }, [expandAllSignal]);

  useEffect(() => {
    if (collapseAllSignal <= 0) return;
    setIsObjectExpanded(false);
  }, [collapseAllSignal]);

  const inner = (value[def.key] as Record<string, unknown> | undefined) ?? {};

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortIds = useMemo(
    () => fieldOrder.map((fi) => `obj-field-${fields[fi]?.key ?? fi}`),
    [fieldOrder, fields],
  );

  function patchInner(nextInner: Record<string, unknown>) {
    onChange({ ...value, [def.key]: nextInner });
  }

  function handleObjectDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortIds.indexOf(String(active.id));
    const newIndex = sortIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const nextOrder = arrayMove(fieldOrder, oldIndex, newIndex);
    setFieldOrder(nextOrder);
    patchInner(reorderRecordByFieldIndices(inner, fields, nextOrder));
  }

  function moveFieldAtPosition(position: number, delta: -1 | 1) {
    const next = position + delta;
    if (next < 0 || next >= fieldOrder.length) return;
    const nextOrder = arrayMove(fieldOrder, position, next);
    setFieldOrder(nextOrder);
    patchInner(reorderRecordByFieldIndices(inner, fields, nextOrder));
  }

  return (
    <div className="min-w-0 rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium">
          {fieldLabel(def.key, "object")}
          {def.required ? (
            <span className="text-destructive" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
          {def.required ? <span className="sr-only"> (required)</span> : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 text-xs"
          onClick={() => setIsObjectExpanded((prev: boolean) => !prev)}
          aria-expanded={isObjectExpanded}
        >
          {isObjectExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isObjectExpanded ? "Collapse" : "Expand"}
        </Button>
      </div>
      {isObjectExpanded ? (
        fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fields in this object.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleObjectDragEnd}
          >
            <SortableContext
              items={sortIds}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-4">
                {fieldOrder.map((fieldIndex, position) => {
                  const childDef = fields[fieldIndex];
                  if (!childDef) return null;
                  const sid = `obj-field-${childDef.key}`;
                  return (
                    <SortableObjectFieldRow
                      key={sid}
                      id={sid}
                      position={position}
                      itemsCount={fieldOrder.length}
                      onMoveUp={() => moveFieldAtPosition(position, -1)}
                      onMoveDown={() => moveFieldAtPosition(position, 1)}
                    >
                      <FieldRow
                        def={childDef}
                        value={inner}
                        onChange={patchInner}
                        depth={depth + 1}
                        flattenArrayItemLinks={flattenArrayItemLinks}
                        expandAllSignal={expandAllSignal}
                        collapseAllSignal={collapseAllSignal}
                      />
                    </SortableObjectFieldRow>
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )
      ) : null}
    </div>
  );
}

function ArrayFieldEditor({
  def,
  value,
  onChange,
  depth,
  expandAllSignal,
  collapseAllSignal,
}: {
  def: LayoutFieldDef;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  depth: number;
  expandAllSignal: number;
  collapseAllSignal: number;
}) {
  const raw = value[def.key];
  const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const [rowIds, setRowIds] = useRowIdsSyncedToLength(items.length);

  const [isArrayExpanded, setIsArrayExpanded] = useState(true);
  const [collapsedArrayItems, setCollapsedArrayItems] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    if (expandAllSignal <= 0) return;
    setIsArrayExpanded(true);
    setCollapsedArrayItems({});
  }, [expandAllSignal]);

  useEffect(() => {
    if (collapseAllSignal <= 0) return;
    setIsArrayExpanded(false);
  }, [collapseAllSignal]);

  function setItems(nextItems: Record<string, unknown>[]) {
    onChange({ ...value, [def.key]: nextItems });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rowIds.findIndex((id) => id === active.id);
    const newIndex = rowIds.findIndex((id) => id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setItems(arrayMove(items, oldIndex, newIndex));
      setRowIds((ids) => arrayMove(ids, oldIndex, newIndex));
    }
  }

  const sortableIds = rowIds;

  return (
    <div className="min-w-0 space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 break-words text-sm font-medium">
          {fieldLabel(def.key, "array")}{" "}
          <span className="text-muted-foreground">({items.length})</span>
          {def.required ? (
            <span className="text-destructive" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
          {def.required ? <span className="sr-only"> (required)</span> : null}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => {
            setItems([...items, emptyArrayItemFromFields(def.fields)]);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 text-xs"
          onClick={() => setIsArrayExpanded((prev: boolean) => !prev)}
          aria-expanded={isArrayExpanded}
        >
          {isArrayExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isArrayExpanded ? "Collapse" : "Expand"}
        </Button>
      </div>
      {!isArrayExpanded ? (
        <p className="text-sm text-muted-foreground">
          {items.length} item(s) hidden.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-4">
              {items.map((item, index) => (
                <SortableArrayItem
                  key={rowIds[index] ?? `fallback-${index}`}
                  id={rowIds[index] ?? `fallback-${index}`}
                  index={index}
                  item={item}
                  def={def}
                  depth={depth}
                  isCollapsed={Boolean(collapsedArrayItems[index])}
                  onToggleCollapse={() =>
                    setCollapsedArrayItems((prev: Record<number, boolean>) => ({
                      ...prev,
                      [index]: !prev[index],
                    }))
                  }
                  onRemove={() => {
                    setItems(items.filter((_, i) => i !== index));
                    setRowIds((ids) => ids.filter((_, i) => i !== index));
                  }}
                  onMoveUp={() => {
                    if (index > 0) {
                      setItems(arrayMove(items, index, index - 1));
                      setRowIds((ids) => arrayMove(ids, index, index - 1));
                    }
                  }}
                  onMoveDown={() => {
                    if (index < items.length - 1) {
                      setItems(arrayMove(items, index, index + 1));
                      setRowIds((ids) => arrayMove(ids, index, index + 1));
                    }
                  }}
                  onChange={(nextItem) => {
                    const next = [...items];
                    next[index] = nextItem;
                    setItems(next);
                  }}
                  expandAllSignal={expandAllSignal}
                  collapseAllSignal={collapseAllSignal}
                  itemsCount={items.length}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function FieldRow({
  def,
  value,
  onChange,
  depth,
  flattenArrayItemLinks,
  expandAllSignal,
  collapseAllSignal,
}: {
  def: LayoutFieldDef;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  depth: number;
  flattenArrayItemLinks: boolean;
  expandAllSignal: number;
  collapseAllSignal: number;
}) {
  const baseId = useId();
  const fid = `${baseId}-${def.key}`;

  if (def.type === "object") {
    return (
      <ObjectFieldEditor
        def={def}
        value={value}
        onChange={onChange}
        depth={depth}
        flattenArrayItemLinks={flattenArrayItemLinks}
        expandAllSignal={expandAllSignal}
        collapseAllSignal={collapseAllSignal}
      />
    );
  }

  if (def.type === "array") {
    return (
      <ArrayFieldEditor
        def={def}
        value={value}
        onChange={onChange}
        depth={depth}
        expandAllSignal={expandAllSignal}
        collapseAllSignal={collapseAllSignal}
      />
    );
  }

  const v = value[def.key];

  function setLeaf(next: unknown) {
    onChange({ ...value, [def.key]: next });
  }

  switch (def.type) {
    case "boolean":
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Checkbox
            id={fid}
            checked={Boolean(v)}
            onCheckedChange={(c) => setLeaf(c === true)}
          />
          <FieldLabelLine htmlFor={fid} def={def} />
        </div>
      );
    case "number": {
      const num = typeof v === "number" ? v : Number(v);
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <Input
            id={fid}
            type="number"
            className="w-full min-w-0 max-w-full"
            value={Number.isFinite(num) ? num : 0}
            onChange={(e) => setLeaf(Number(e.target.value))}
          />
        </div>
      );
    }
    case "description":
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <CmsHtmlDescriptionEditor
            id={fid}
            value={typeof v === "string" ? v : ""}
            onChange={(html) => setLeaf(html)}
            placeholder="Rich text — headings, lists, links…"
          />
        </div>
      );
    case "textarea":
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <Textarea
            id={fid}
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setLeaf(e.target.value)}
            placeholder="Plain multi-line text"
            rows={4}
            className="min-h-[5rem] w-full min-w-0 max-w-full resize-y"
          />
        </div>
      );
    case "badge":
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <Input
            id={fid}
            className="w-full min-w-0 max-w-full"
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setLeaf(e.target.value)}
            placeholder="Short label"
          />
        </div>
      );
    case "link": {
      const nested = value[def.key];
      const rawForLink =
        flattenArrayItemLinks &&
        nested &&
        typeof nested === "object" &&
        !Array.isArray(nested) &&
        ("value" in (nested as object) || "href" in (nested as object))
          ? nested
          : flattenArrayItemLinks
            ? value
            : v;
      const raw = rawForLink;
      const obj =
        raw && typeof raw === "object" && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : { value: "", href: "", target: "_self" };
      const label = String(obj.value ?? "");
      const href = String(obj.href ?? "");
      const target = String(obj.target ?? "_self").trim() || "_self";
      function patchLink(
        partial: Partial<{ value: string; href: string; target: string }>,
      ) {
        const next = {
          value: label,
          href,
          target,
          ...partial,
        };
        if (flattenArrayItemLinks) {
          const nextRecord: Record<string, unknown> = { ...value, ...next };
          delete nextRecord[def.key];
          onChange(nextRecord);
          return;
        }
        setLeaf(next);
      }
      return (
        <div className="min-w-0 space-y-3">
          <FieldLabelLine htmlFor={`${fid}-value`} def={def} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fid}-value`} className="text-xs">
                Label
              </Label>
              <Input
                id={`${fid}-value`}
                className="w-full min-w-0 max-w-full"
                value={label}
                onChange={(e) => patchLink({ value: e.target.value })}
                placeholder="Link text"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fid}-href`} className="text-xs">
                URL
              </Label>
              <Input
                id={`${fid}-href`}
                type="url"
                className="w-full min-w-0 max-w-full font-mono text-sm"
                value={href}
                onChange={(e) => patchLink({ href: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${fid}-target`} className="text-xs">
              Open in
            </Label>
            <Select
              value={target === "_blank" ? "_blank" : "_self"}
              onValueChange={(next) => patchLink({ target: next })}
            >
              <SelectTrigger id={`${fid}-target`} className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same tab</SelectItem>
                <SelectItem value="_blank">New tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    case "image":
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <CmsReferenceScreenshotField
            inputId={fid}
            hideLabel
            value={typeof v === "string" ? v : ""}
            onChange={(url) => setLeaf(url)}
          />
        </div>
      );
    case "icon":
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <Input
            id={fid}
            type="text"
            className="w-full min-w-0 max-w-full font-mono text-sm"
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setLeaf(e.target.value)}
            placeholder="e.g. Star, Home (Lucide name), emoji, or URL"
            spellCheck={false}
          />
        </div>
      );
    case "title":
    case "url":
    case "date":
    default:
      return (
        <div className="min-w-0 space-y-2">
          <FieldLabelLine htmlFor={fid} def={def} />
          <Input
            id={fid}
            type={
              def.type === "url" ? "url" : def.type === "date" ? "date" : "text"
            }
            className="w-full min-w-0 max-w-full"
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setLeaf(e.target.value)}
          />
        </div>
      );
  }
}

export interface LayoutConfigFormProps {
  rootKey: string;
  defs: LayoutFieldDef[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  /** When false, hides the schema root key line (compact page / new layout flow). */
  showRootKeyHint?: boolean;
}

export function LayoutConfigForm({
  rootKey,
  defs,
  value,
  onChange,
  showRootKeyHint = true,
}: LayoutConfigFormProps) {
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);
  const inner = (value[rootKey] as Record<string, unknown> | undefined) ?? {};

  if (defs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This layout has no fields yet. Edit the layout in the builder.
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {showRootKeyHint ? (
        <p className="text-xs text-muted-foreground">
          Root key{" "}
          <span className="break-all font-mono text-foreground">{rootKey}</span>
        </p>
      ) : null}

      <FieldGroup
        defs={defs}
        value={inner}
        onChange={(nextInner) => onChange({ ...value, [rootKey]: nextInner })}
        expandAllSignal={expandAllSignal}
        collapseAllSignal={collapseAllSignal}
      />
    </div>
  );
}
