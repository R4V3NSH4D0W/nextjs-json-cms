"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@/lib/shared/react-query";
import { CmsPageSeoEditor } from "@/components/cms/cms-page-seo-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CMS_LAYOUT_PAGE_PREVIEW_ASIDE_CLASSNAME,
  CmsLayoutPagePreviewAside,
} from "@/components/cms/cms-layout-page-preview-aside";
import { CmsLayoutSlotsEditor } from "@/components/cms/cms-layout-slots-editor";
import { cmsApi, type CmsLayoutResponse } from "@/lib/cms/api";
import { useCmsLayouts, useCmsPage } from "@/hooks/use-cms";
import {
  useCmsAnnouncementsConfig,
  useCmsFooterConfig,
  useCmsNavigationConfig,
} from "@/hooks/use-cms-site-content";
import {
  blocksToLayoutSlots,
  validateCmsSlotsLayoutFields,
} from "@/lib/cms/page-slots";
import { syncLayoutSlotsToPage } from "@/lib/cms/sync-layout-slots";
import {
  slotsWithAddedLayout,
  type CmsNewPageLayoutSlot,
} from "@/lib/cms/new-page-draft";
import { buildPayloadTemplateFromSchema } from "@/lib/cms/layout-payload";
import {
  cmsPageSeoFormValuesFromApi,
  emptyCmsPageSeoFormValues,
  toCmsPageSeoApiPatch,
  type CmsPageSeoFormValues,
} from "@/lib/cms/page-seo";
import {
  resolveSiteChromeReferenceImageUrl,
  siteChromeSectionPlaceholderLabel,
} from "@/lib/cms/site-chrome-preview";
import {
  readSectionsExpandedPref,
  writeSectionsExpandedPref,
} from "@/lib/cms/sections-expand-pref";
import { toast } from "sonner";
import {
  parseCmsPageDraftData,
  serializeCmsPageDraftData,
} from "@/lib/cms/cms-page-draft-data";

function CmsPageEditContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const id = typeof params.id === "string" ? params.id : "";

  const { data, isLoading, isError, error, refetch } = useCmsPage(id);
  const page = data?.page;

  const { data: layoutsRes, isLoading: layoutsLoading } = useCmsLayouts();
  const layouts = layoutsRes?.layouts ?? [];

  const { data: navSite } = useCmsNavigationConfig();
  const { data: footerSite } = useCmsFooterConfig();
  const { data: annSite } = useCmsAnnouncementsConfig();
  const siteChrome = useMemo(
    () => ({
      announcement: resolveSiteChromeReferenceImageUrl(
        annSite?.referenceImageUrl,
        annSite?.sections,
        layouts
      ),
      navigation: resolveSiteChromeReferenceImageUrl(
        navSite?.referenceImageUrl,
        navSite?.sections,
        layouts
      ),
      footer: resolveSiteChromeReferenceImageUrl(
        footerSite?.referenceImageUrl,
        footerSite?.sections,
        layouts
      ),
    }),
    [annSite, navSite, footerSite, layouts]
  );

  const siteChromePlaceholders = useMemo(
    () => ({
      announcement: siteChromeSectionPlaceholderLabel(
        annSite?.referenceImageUrl,
        annSite?.sections,
        layouts
      ),
      navigation: siteChromeSectionPlaceholderLabel(
        navSite?.referenceImageUrl,
        navSite?.sections,
        layouts
      ),
      footer: siteChromeSectionPlaceholderLabel(
        footerSite?.referenceImageUrl,
        footerSite?.sections,
        layouts
      ),
    }),
    [annSite, navSite, footerSite, layouts]
  );

  const [syncing, setSyncing] = useState(false);
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);
  const [sectionsPrefLoaded, setSectionsPrefLoaded] = useState(false);
  const [defaultSectionExpanded, setDefaultSectionExpanded] = useState(true);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [slots, setSlots] = useState<CmsNewPageLayoutSlot[]>([]);
  const [seo, setSeo] = useState<CmsPageSeoFormValues>(emptyCmsPageSeoFormValues);

  const consumedAddLayoutSearchRef = useRef<string | null>(null);
  /** Only reset slots from the server when the page payload actually changed (e.g. save or navigation). Avoids React Query refetches overwriting local sections after `addLayoutId` append. */
  const lastSlotsHydrationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setDefaultSectionExpanded(readSectionsExpandedPref(id));
    setSectionsPrefLoaded(true);
  }, [id]);

  useLayoutEffect(() => {
    if (!page) return;
    const hydrationKey = `${page.id}:${page.updatedAt}`;
    if (lastSlotsHydrationKeyRef.current === hydrationKey) {
      return;
    }
    lastSlotsHydrationKeyRef.current = hydrationKey;
    const fromDraft = parseCmsPageDraftData(page.draftData);
    if (fromDraft) {
      setTitle(fromDraft.title);
      setSlug(fromDraft.slug);
      setSlots(fromDraft.slots);
      setSeo(fromDraft.seo);
    } else {
      setTitle(page.title);
      setSlug(page.slug);
      setSlots(blocksToLayoutSlots(page));
      setSeo(cmsPageSeoFormValuesFromApi(page));
    }
    setPublished(page.published === true);
  }, [page]);

  useEffect(() => {
    if (!page) return;
    const addLayoutId = searchParams.get("addLayoutId");
    if (!addLayoutId) {
      consumedAddLayoutSearchRef.current = null;
      return;
    }
    const searchKey = searchParams.toString();
    if (consumedAddLayoutSearchRef.current === searchKey) return;
    consumedAddLayoutSearchRef.current = searchKey;
    let cancelled = false;

    const applyAddedLayout = async () => {
      let templatePayload: Record<string, unknown> | null = null;
      try {
        const cached = queryClient.getQueryData<CmsLayoutResponse>([
          "cms-layouts",
          addLayoutId,
        ]);
        const layout =
          cached?.layout ??
          (await cmsApi.getLayout(addLayoutId)).layout;
        const schema = layout?.schema;
        if (schema && typeof schema === "object" && !Array.isArray(schema)) {
          templatePayload = buildPayloadTemplateFromSchema(
            schema as Record<string, unknown>
          );
        }
      } catch {
        // Keep adding the slot even if layout template fetch fails.
      }
      if (cancelled) return;

      setSlots((prev) => {
        const next = slotsWithAddedLayout(prev, addLayoutId);
        // Seed the newly added/replaced slot immediately with schema defaults.
        if (!templatePayload || Object.keys(templatePayload).length === 0) {
          return next;
        }
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const slot = next[i];
          if (slot.layoutId !== addLayoutId) continue;
          if (slot.appliedLayoutId === addLayoutId) continue;
          return next.map((s, idx) =>
            idx === i
              ? {
                  ...s,
                  configValues: templatePayload as Record<string, unknown>,
                  appliedLayoutId: addLayoutId,
                }
              : s
          );
        }
        return next;
      });
      router.replace(`/dashboard/cms/pages/${id}`, { scroll: false });
      toast.success("Layout added — fill in the fields below.");
    };

    void applyAddedLayout();
    return () => {
      cancelled = true;
    };
  }, [page, searchParams, router, id, queryClient]);

  const patchSlot = useCallback(
    (slotId: string, patch: Partial<CmsNewPageLayoutSlot>) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const reorderSlots = useCallback((activeId: string, overId: string) => {
    setSlots((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === activeId);
      const newIndex = prev.findIndex((s) => s.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }, []);

  const returnToLayoutsHref = `/dashboard/cms/layouts?returnTo=${encodeURIComponent(`/dashboard/cms/pages/${id}`)}`;

  async function submit(mode: "draft" | "publish") {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const sectionError = await validateCmsSlotsLayoutFields(
      slots,
      async (layoutId) => {
        const cached = queryClient.getQueryData<CmsLayoutResponse>([
          "cms-layouts",
          layoutId,
        ]);
        if (cached?.layout) return cached.layout;
        const res = await cmsApi.getLayout(layoutId);
        return res.layout ?? null;
      }
    );
    if (sectionError) {
      toast.error(sectionError);
      return;
    }
    if (!page) return;

    setSyncing(true);
    try {
      if (mode === "draft") {
        const draftPayload = serializeCmsPageDraftData({
          title: title.trim(),
          slug: slug.trim(),
          slots,
          seo,
        });
        await cmsApi.updatePage(id, { draftData: draftPayload });
        await queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
        await queryClient.invalidateQueries({ queryKey: ["cms-pages", id] });
        toast.success(
          "Draft saved in admin only — the public API is unchanged until you publish."
        );
        return;
      }

      const snapshot = page;
      await cmsApi.updatePage(id, {
        title: title.trim(),
        slug: slug.trim() || undefined,
        published,
        isActive: true,
        layoutId: slots.find((s) => s.layoutId)?.layoutId ?? null,
        draftData: null,
        ...toCmsPageSeoApiPatch(seo),
      });

      await syncLayoutSlotsToPage({
        pageId: id,
        pageSnapshot: snapshot,
        slots,
      });

      await queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      await queryClient.invalidateQueries({ queryKey: ["cms-pages", id] });
      toast.success("Published — live content updated on the public API.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save page");
    } finally {
      setSyncing(false);
    }
  }

  if (!id) {
    return (
      <p className="text-sm text-muted-foreground">Invalid page id.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading page…
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="space-y-3">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Could not load this page."}
        </p>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/cms/pages">Back to pages</Link>
        </Button>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const pending = syncing;

  return (
    <div className="flex flex-col space-y-5 pb-24">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit gap-2 px-0" asChild>
          <Link href="/dashboard/cms/pages">
            <ArrowLeft className="h-4 w-4" />
            CMS pages
          </Link>
        </Button>
        <span className="text-2xl font-bold">
          {title.trim() ? title.trim() : "Edit page"}
        </span>
      </div>

      <div className="flex flex-col gap-3 border-b border-t py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">Editing page</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void submit("draft")}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void submit("publish")}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Publish changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="general" className="w-full gap-4">
            <TabsList className="grid h-9 w-full grid-cols-2 sm:max-w-md">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-4 space-y-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  type="text"
                  required
                  className="w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={pending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-active-published"
                    checked={published}
                    onCheckedChange={(v) => setPublished(v === true)}
                    disabled={pending}
                  />
                  <Label
                    htmlFor="edit-active-published"
                    className="font-normal leading-none"
                  >
                    Active (published on public API)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Save draft</span>{" "}
                  keeps your edits in admin only.{" "}
                  <span className="font-medium text-foreground">
                    Publish changes
                  </span>{" "}
                  updates the live site and applies Active above.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold">Page content</h2>
                  {slots.length > 0 ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          writeSectionsExpandedPref(id, "expanded");
                          setExpandAllSignal((n) => n + 1);
                        }}
                      >
                        Expand
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          writeSectionsExpandedPref(id, "collapsed");
                          setCollapseAllSignal((n) => n + 1);
                        }}
                      >
                        Collapse
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag the handle to reorder or remove a section. Add sections with{" "}
                  <span className="font-medium">Add layout</span> below (same flow for
                  each new section). Values are stored as{" "}
                  <span className="font-mono">text_block</span> blocks. If you add fields
                  to a layout later, saving merges new fields without losing existing
                  content. The page&apos;s <span className="font-mono">layoutId</span>{" "}
                  follows the first section that has a layout.
                </p>
                {slots.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                    No sections yet. Use{" "}
                    <span className="font-medium text-foreground">Add layout</span>{" "}
                    below to pick a layout and add a section.
                  </p>
                ) : null}
                <CmsLayoutSlotsEditor
                  key={`${id}-${
                    sectionsPrefLoaded
                      ? defaultSectionExpanded
                        ? "sections-expanded"
                        : "sections-collapsed"
                      : "sections-pref-init"
                  }`}
                  slots={slots}
                  onSlotPatch={patchSlot}
                  onReorderSlots={reorderSlots}
                  onRemoveSlot={removeSlot}
                  layouts={layouts}
                  layoutsLoading={layoutsLoading}
                  defaultSectionExpanded={
                    sectionsPrefLoaded ? defaultSectionExpanded : true
                  }
                  expandAllSignal={expandAllSignal}
                  collapseAllSignal={collapseAllSignal}
                  disabled={pending}
                />
              </div>

              <div className="flex flex-row gap-2">
                <div className="mx-auto flex w-full max-w-4xl justify-center px-4">
                  <Button variant="secondary" size="lg" asChild>
                    <Link href={returnToLayoutsHref}>Add layout</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="seo" className="mt-4">
              <CmsPageSeoEditor
                slug={slug}
                onSlugChange={setSlug}
                seo={seo}
                onSeoChange={setSeo}
                disabled={pending}
                slugInputId="edit-slug"
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className={CMS_LAYOUT_PAGE_PREVIEW_ASIDE_CLASSNAME}>
          <CmsLayoutPagePreviewAside
            slots={slots}
            layouts={layouts}
            siteChrome={siteChrome}
            siteChromePlaceholders={siteChromePlaceholders}
          />
        </aside>
      </div>
    </div>
  );
}

export default function CmsPageEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CmsPageEditContent />
    </Suspense>
  );
}
