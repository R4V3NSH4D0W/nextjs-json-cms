"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { CmsLayoutListItem } from "@/lib/cms/api";
import type { CmsNewPageLayoutSlot } from "@/lib/cms/new-page-draft";
import { absoluteApiUrl } from "@/lib/cms/absolute-url";
import { cn } from "@/lib/shared/utils";

/** Left-bottom overlay on reference images: legible on varied screenshots; colors shift by preview `mode`. */
function previewCaptionClasses(mode: "default" | "imageOnly"): {
  strong: string;
  muted: string;
} {
  if (mode === "imageOnly") {
    return {
      strong:
        "font-medium text-zinc-50 [text-shadow:0_1px_4px_rgba(0,0,0,0.92),0_0_1px_rgba(0,0,0,0.9)]",
      muted:
        "font-normal text-zinc-400 [text-shadow:0_1px_3px_rgba(0,0,0,0.88)]",
    };
  }
  return {
    strong:
      "font-medium text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.88),0_0_1px_rgba(0,0,0,0.85)]",
    muted:
      "font-normal text-zinc-200/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.78)]",
  };
}

/** Sticky column width for new/edit CMS page preview (wider strip on large screens). */
export const CMS_LAYOUT_PAGE_PREVIEW_ASIDE_CLASSNAME =
  "w-full shrink-0 lg:sticky lg:top-4 lg:self-start lg:w-[min(100%,min(720px,52vw))] lg:max-w-[min(720px,55%)] lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

/** Reference URLs from site chrome (CMS navigation / footer / announcements). Shown above page sections in the preview strip. */
export interface CmsSiteChromePreviewUrls {
  announcement?: string | null;
  navigation?: string | null;
  footer?: string | null;
}

/** When no URL is available, show a dashed placeholder with this label (layout name). */
export interface CmsSiteChromePreviewPlaceholders {
  announcement?: string;
  navigation?: string;
  footer?: string;
}

type ChromePreviewKey = "announcement" | "navigation" | "footer";

const CHROME_LABEL: Record<ChromePreviewKey, string> = {
  announcement: "Announcement",
  navigation: "Navigation",
  footer: "Footer",
};

function trimUrl(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw.trim() : "";
}

type LeadingRow =
  | { key: "announcement" | "navigation"; url: string }
  | { key: "announcement" | "navigation"; placeholderLabel: string };

function buildLeadingChromeRows(
  siteChrome: CmsSiteChromePreviewUrls | undefined,
  placeholders?: CmsSiteChromePreviewPlaceholders | undefined
): LeadingRow[] {
  if (!siteChrome && !placeholders) return [];
  const out: LeadingRow[] = [];
  const keys: ("announcement" | "navigation")[] = ["announcement", "navigation"];
  for (const key of keys) {
    const url = trimUrl(siteChrome?.[key]);
    if (url) {
      out.push({ key, url });
      continue;
    }
    const ph = placeholders?.[key]?.trim();
    if (ph) out.push({ key, placeholderLabel: ph });
  }
  return out;
}

type FooterRow =
  | { key: "footer"; url: string }
  | { key: "footer"; placeholderLabel: string };

function buildFooterChromeRow(
  siteChrome: CmsSiteChromePreviewUrls | undefined,
  placeholders?: CmsSiteChromePreviewPlaceholders | undefined
): FooterRow | null {
  const url = trimUrl(siteChrome?.footer);
  if (url) return { key: "footer", url };
  const ph = placeholders?.footer?.trim();
  if (ph) return { key: "footer", placeholderLabel: ph };
  return null;
}

function ChromeOrPlaceholderBlock({
  row,
  mode,
  chromeKey,
}: {
  row: { url?: string; placeholderLabel?: string };
  mode: "default" | "imageOnly";
  chromeKey: ChromePreviewKey;
}) {
  if (row.url) {
    const cap = previewCaptionClasses(mode);
    return (
      <div className="relative w-full min-w-0">
        <Image
          src={absoluteApiUrl(row.url)}
          alt=""
          width={1600}
          height={900}
          className="block h-auto w-full max-w-full select-none align-middle"
          draggable={false}
          sizes="(max-width: 1024px) 100vw, min(720px, 55vw)"
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-2 left-2 max-w-[min(calc(100%-1rem),20rem)] text-left",
            mode === "imageOnly" && "max-w-[min(calc(100%-1rem),18rem)]"
          )}
        >
          <p className="text-[11px] leading-snug">
            <span className={cap.strong}>{CHROME_LABEL[chromeKey]}</span>
            <span className={cap.muted}> · Site settings</span>
          </p>
        </div>
      </div>
    );
  }
  if (row.placeholderLabel) {
    return (
      <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 border-b border-dashed bg-muted/25 px-3 py-6 text-center">
        <p className="text-xs font-medium text-foreground/90">
          {row.placeholderLabel}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {mode === "imageOnly"
            ? "Add a reference image on this layout in Layouts."
            : `${CHROME_LABEL[chromeKey]} · Add a reference image on this layout in CMS → Layouts.`}
        </p>
      </div>
    );
  }
  return null;
}

export function CmsLayoutPagePreviewAside({
  slots,
  layouts,
  title = "Page preview",
  description = "Section reference images stack in order to mimic the full page. Not saved on the page.",
  mode = "default",
  siteChrome,
  siteChromePlaceholders,
}: {
  slots: CmsNewPageLayoutSlot[];
  layouts: CmsLayoutListItem[];
  /** Overrides default “Page preview” heading (e.g. site chrome). */
  title?: string;
  /** Overrides default helper text under the heading. */
  description?: string;
  /**
   * `imageOnly`: stacked reference images only — no heading, no section labels on images.
   * Use for site chrome (navbar / announcements) where the strip is display-only.
   */
  mode?: "default" | "imageOnly";
  /**
   * When set (e.g. on new/edit page), announcement → navigation → footer reference images
   * from site settings are prepended to the strip so the preview matches the full page frame.
   */
  siteChrome?: CmsSiteChromePreviewUrls;
  /**
   * When a site chrome area has a layout but no reference image yet, show a dashed placeholder
   * with this label (usually the layout name).
   */
  siteChromePlaceholders?: CmsSiteChromePreviewPlaceholders;
}) {
  const byId = useMemo(
    () => new Map(layouts.map((l) => [l.id, l])),
    [layouts]
  );

  const leadingChromeRows = useMemo(
    () => buildLeadingChromeRows(siteChrome, siteChromePlaceholders),
    [siteChrome, siteChromePlaceholders]
  );

  const footerChromeRow = useMemo(
    () => buildFooterChromeRow(siteChrome, siteChromePlaceholders),
    [siteChrome, siteChromePlaceholders]
  );

  const sectionPreviewRows = useMemo(() => {
    return slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => Boolean(slot.layoutId))
      .map(({ slot, index }) => {
        const meta = slot.layoutId ? byId.get(slot.layoutId) : undefined;
        const refUrl = meta?.referenceImageUrl?.trim();
        return {
          slotId: slot.id,
          sectionLabel: `Section ${index + 1}`,
          layoutName: meta?.name ?? "Unknown layout",
          imageUrl: refUrl ? refUrl : null,
        };
      });
  }, [slots, byId]);

  const totalRows =
    leadingChromeRows.length +
    sectionPreviewRows.length +
    (footerChromeRow ? 1 : 0);
  const showHeader = mode !== "imageOnly";

  const defaultDescription =
    siteChrome !== undefined
      ? "Includes announcement, navigation, and footer reference images from site settings when set, then each section’s layout reference — stacked like the full page. Not saved on the page."
      : description;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {showHeader ? (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {siteChrome !== undefined ? defaultDescription : description}
          </p>
        </div>
      ) : null}

      {totalRows === 0 ? (
        <div
          className={
            mode === "imageOnly"
              ? "flex min-h-[min(40vh,320px)] flex-col items-center justify-center border border-dashed bg-muted/15 lg:aspect-[16/10] lg:min-h-0"
              : "flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-3  border border-dashed bg-muted/15 px-4 py-10 text-center lg:aspect-[16/10] lg:min-h-0"
          }
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground/45" />
          {mode === "imageOnly" ? null : (
            <p className="max-w-[28ch] text-sm text-muted-foreground">
              Add reference screenshots in{" "}
              <span className="font-medium">CMS → Navigation / Footer / Announcements</span>{" "}
              and pick layouts with reference images for sections. They stack here
              in page order.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden  border border-border bg-background shadow-sm">
          <div className="flex min-w-0 flex-col gap-0">
            {leadingChromeRows.map((row) => (
              <div
                key={`chrome-${row.key}`}
                className="relative w-full shrink-0 bg-muted/30"
              >
                <ChromeOrPlaceholderBlock
                  row={
                    "url" in row
                      ? { url: row.url }
                      : { placeholderLabel: row.placeholderLabel }
                  }
                  mode={mode}
                  chromeKey={row.key}
                />
              </div>
            ))}
            {sectionPreviewRows.map((row) => {
              const cap = previewCaptionClasses(mode);
              return (
              <div
                key={row.slotId}
                className="relative w-full min-w-0 shrink-0 bg-muted/30"
              >
                {row.imageUrl ? (
                  <>
                    <Image
                      src={absoluteApiUrl(row.imageUrl)}
                      alt=""
                      width={1600}
                      height={900}
                      className="block h-auto w-full max-w-full select-none align-middle"
                      draggable={false}
                      sizes="(max-width: 1024px) 100vw, min(720px, 55vw)"
                    />
                    <div
                      className={cn(
                        "pointer-events-none absolute bottom-2 left-2 max-w-[min(calc(100%-1rem),20rem)] text-left",
                        mode === "imageOnly" && "max-w-[min(calc(100%-1rem),18rem)]"
                      )}
                    >
                      <p className="text-[11px] leading-snug">
                        <span className={cap.strong}>{row.sectionLabel}</span>
                        <span className={cap.muted}> · {row.layoutName}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 border-b border-dashed bg-muted/25 px-3 py-6 text-center">
                    <p className="text-xs font-medium text-foreground/90">
                      {row.layoutName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {mode === "imageOnly"
                        ? "Add a reference image on this layout in Layouts."
                        : "No reference image on this layout — add one in CMS → Layouts."}
                    </p>
                  </div>
                )}
              </div>
            );
            })}
            {footerChromeRow ? (
              <div
                key="chrome-footer"
                className="relative w-full shrink-0 bg-muted/30"
              >
                <ChromeOrPlaceholderBlock
                  row={
                    "url" in footerChromeRow
                      ? { url: footerChromeRow.url }
                      : { placeholderLabel: footerChromeRow.placeholderLabel }
                  }
                  mode={mode}
                  chromeKey="footer"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
