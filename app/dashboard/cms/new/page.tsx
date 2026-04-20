"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { useQueryClient } from "@/lib/shared/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useCreateCmsPage, useCmsLayouts } from "@/hooks/use-cms";
import {
  useCmsAnnouncementsConfig,
  useCmsFooterConfig,
  useCmsNavigationConfig,
} from "@/hooks/use-cms-site-content";
import {
  clearCmsNewPageDraft,
  loadCmsNewPageDraft,
  saveCmsNewPageDraft,
  slotsWithAddedLayout,
  type CmsNewPageLayoutSlot,
} from "@/lib/cms/new-page-draft";
import {
  CMS_SECTIONS_EXPAND_SCOPE_NEW,
  readSectionsExpandedPref,
  writeSectionsExpandedPref,
} from "@/lib/cms/sections-expand-pref";
import { mergeLayoutMetaIntoConfig } from "@/lib/cms/block-meta";
import { validateCmsSlotsLayoutFields } from "@/lib/cms/page-slots";
import {
  resolveSiteChromeReferenceImageUrl,
  siteChromeSectionPlaceholderLabel,
} from "@/lib/cms/site-chrome-preview";
import {
  emptyCmsPageSeoFormValues,
  toCmsPageSeoApiPatch,
  type CmsPageSeoFormValues,
} from "@/lib/cms/page-seo";
import { CmsPageSeoEditor } from "@/components/cms/cms-page-seo-editor";
import { toast } from "sonner";

const NEW_PAGE_PATH = "/dashboard/cms/new";

function NewPageContent() {
  const { currentProject } = useCurrentProject();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  /** Start with no sections; user adds via "Add layout" (see empty state below). */
  const [slots, setSlots] = useState<CmsNewPageLayoutSlot[]>([]);
  const [seo, setSeo] = useState<CmsPageSeoFormValues>(emptyCmsPageSeoFormValues);

  /** Dedupes Strict Mode double-invoke; reset when `addLayoutId` leaves the URL. */
  const consumedAddLayoutSearchRef = useRef<string | null>(null);

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

  const createPage = useCreateCmsPage();
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);
  const [sectionsPrefLoaded, setSectionsPrefLoaded] = useState(false);
  const [defaultSectionExpanded, setDefaultSectionExpanded] = useState(true);

  useEffect(() => {
    setDefaultSectionExpanded(
      readSectionsExpandedPref(CMS_SECTIONS_EXPAND_SCOPE_NEW)
    );
    setSectionsPrefLoaded(true);
  }, []);

  useEffect(() => {
    const draft = loadCmsNewPageDraft();
    if (draft) {
      setTitle(draft.title);
      setSlug(draft.slug);
      setSlots(draft.slots.length > 0 ? draft.slots : []);
      setSeo(draft.seo);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCmsNewPageDraft({ v: 1, title, slug, slots, seo });
  }, [hydrated, title, slug, slots, seo]);

  useEffect(() => {
    if (!hydrated) return;
    const addLayoutId = searchParams.get("addLayoutId");
    if (!addLayoutId) {
      consumedAddLayoutSearchRef.current = null;
      return;
    }
    const searchKey = searchParams.toString();
    if (consumedAddLayoutSearchRef.current === searchKey) return;
    consumedAddLayoutSearchRef.current = searchKey;

    setSlots((prev) => slotsWithAddedLayout(prev, addLayoutId));
    router.replace(NEW_PAGE_PATH, { scroll: false });
    toast.success("Layout added — fill in the fields below.");
  }, [hydrated, searchParams, router]);

  const patchSlot = useCallback(
    (id: string, patch: Partial<CmsNewPageLayoutSlot>) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
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

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const returnToLayoutsHref = `/dashboard/cms/layouts?returnTo=${encodeURIComponent(NEW_PAGE_PATH)}`;

  function buildPagePayload(publish: boolean) {
    const firstLayoutId =
      slots.find((s) => s.layoutId)?.layoutId ?? null;

    const s = slug.trim();
    return {
      title: title.trim(),
      published: publish,
      ...(s ? { slug: s } : {}),
      layoutId: firstLayoutId,
      ...toCmsPageSeoApiPatch(seo),
    };
  }

  async function submit(publish: boolean) {
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
        const res = await cmsApi.getLayout(currentProject!.slug, layoutId);
        return res.layout ?? null;
      }
    );
    if (sectionError) {
      toast.error(sectionError);
      return;
    }

    setSavingBlocks(true);
    try {
      const pageRes = await createPage.mutateAsync(buildPagePayload(publish));
      const pageId = pageRes.page.id;

      const orderedWithLayout = slots.filter((s) => s.layoutId);
      for (const slot of orderedWithLayout) {
        await cmsApi.addBlock(currentProject!.slug, pageId, {
          type: "text_block",
          config: mergeLayoutMetaIntoConfig(
            slot.configValues,
            slot.layoutId
          ),
          isActive: slot.isActive !== false,
        });
      }

      void queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      clearCmsNewPageDraft();
      if (publish) {
        toast.success(
          "Page published — it will appear on the public API and storefront."
        );
      } else {
        toast.success(
          "Draft saved — the page is unpublished and hidden from the public API until you publish it from the editor."
        );
      }
      router.push("/dashboard/cms/pages");
    } finally {
      setSavingBlocks(false);
    }
  }

  const pending = createPage.isPending || savingBlocks;

  return (
    <div className="flex flex-col space-y-5 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold">
              {title.trim() ? title.trim() : "New page"}
            </span>
            <Badge variant="secondary" className="font-normal">
              Draft mode
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Creating a new page — nothing is public until you publish.
          </p>
        </div>
        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void submit(false)}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save as draft
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void submit(true)}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Publish page
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/35 px-4 py-3">
        <div className="flex gap-3">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0 space-y-1.5 text-sm">
            <p className="font-medium text-foreground">How draft mode works</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                This form is auto-saved in your browser (session) while you work.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Save as draft
                </span>{" "}
                stores an unpublished page — it will show as{" "}
                <span className="font-medium text-foreground">Draft</span> in
                CMS Pages and will not appear on the public API.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Publish page
                </span>{" "}
                makes the page live. You can switch draft / published later from
                the page editor.
              </li>
            </ul>
          </div>
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  className="w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Home"
                />
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
                          writeSectionsExpandedPref(
                            CMS_SECTIONS_EXPAND_SCOPE_NEW,
                            "expanded"
                          );
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
                          writeSectionsExpandedPref(
                            CMS_SECTIONS_EXPAND_SCOPE_NEW,
                            "collapsed"
                          );
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
                  key={
                    sectionsPrefLoaded
                      ? defaultSectionExpanded
                        ? "sections-expanded"
                        : "sections-collapsed"
                      : "sections-pref-init"
                  }
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
                    <Link
                      href={returnToLayoutsHref}
                      onClick={() =>
                        saveCmsNewPageDraft({ v: 1, title, slug, slots, seo })
                      }
                    >
                      Add layout
                    </Link>
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
                slugInputId="slug"
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <NewPageContent />
    </Suspense>
  );
}
