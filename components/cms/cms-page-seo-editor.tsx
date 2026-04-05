"use client";

import { CmsReferenceScreenshotField } from "@/components/cms/cms-reference-screenshot-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CmsPageSeoFormValues } from "@/lib/cms/page-seo";

export interface CmsPageSeoEditorProps {
  slug: string;
  onSlugChange: (slug: string) => void;
  seo: CmsPageSeoFormValues;
  onSeoChange: (next: CmsPageSeoFormValues) => void;
  disabled?: boolean;
  slugInputId?: string;
}

export function CmsPageSeoEditor({
  slug,
  onSlugChange,
  seo,
  onSeoChange,
  disabled = false,
  slugInputId = "cms-page-slug",
}: CmsPageSeoEditorProps) {
  function patch(p: Partial<CmsPageSeoFormValues>) {
    onSeoChange({ ...seo, ...p });
  }

  const metaDescLen = seo.metaDescription.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={slugInputId}>Slug</Label>
        <Input
          id={slugInputId}
          type="text"
          className="w-full font-mono text-sm"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="Optional — generated from title if empty"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          URL path for this page on the storefront. Leave empty to generate from
          the page title when you publish.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="cms-seo-meta-title">Meta title</Label>
        <Input
          id="cms-seo-meta-title"
          type="text"
          className="w-full"
          value={seo.metaTitle}
          onChange={(e) => patch({ metaTitle: e.target.value })}
          placeholder="Defaults to page title if empty"
          disabled={disabled}
          maxLength={320}
        />
        <p className="text-xs text-muted-foreground">
          Shown in search results; aim for roughly 50–60 characters.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="cms-seo-meta-desc">Meta description</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {metaDescLen}/320
          </span>
        </div>
        <Textarea
          id="cms-seo-meta-desc"
          className="min-h-[88px] resize-y"
          value={seo.metaDescription}
          onChange={(e) => patch({ metaDescription: e.target.value })}
          placeholder="Short summary for search results (often ~150–160 characters)"
          disabled={disabled}
          maxLength={320}
          rows={4}
        />
      </div>

      <Separator />

      <CmsReferenceScreenshotField
        inputId="cms-seo-og-image"
        label="Social preview image (Open Graph)"
        description="Same as layout image fields: upload, pick from the media library, or paste a URL/path."
        value={seo.ogImage}
        onChange={(url) => patch({ ogImage: url })}
        disabled={disabled}
      />

      <div className="space-y-2">
        <Label htmlFor="cms-seo-og-title">Social title override</Label>
        <Input
          id="cms-seo-og-title"
          type="text"
          className="w-full"
          value={seo.ogTitle}
          onChange={(e) => patch({ ogTitle: e.target.value })}
          placeholder="Defaults to meta title or page title if empty"
          disabled={disabled}
          maxLength={320}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cms-seo-og-desc">Social description override</Label>
        <Textarea
          id="cms-seo-og-desc"
          className="min-h-[72px] resize-y"
          value={seo.ogDescription}
          onChange={(e) => patch({ ogDescription: e.target.value })}
          placeholder="Defaults to meta description if empty"
          disabled={disabled}
          maxLength={320}
          rows={3}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="cms-seo-canonical">Canonical URL</Label>
        <Input
          id="cms-seo-canonical"
          type="url"
          className="w-full font-mono text-sm"
          value={seo.canonicalUrl}
          onChange={(e) => patch({ canonicalUrl: e.target.value })}
          placeholder="https://… (optional)"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Preferred URL if this content is reachable from multiple paths.
        </p>
      </div>

      <div className="flex flex-row items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="cms-seo-noindex" className="text-sm font-medium">
            Hide from search engines
          </Label>
          <p className="text-xs text-muted-foreground">
            Adds a noindex hint for crawlers when supported by the storefront.
          </p>
        </div>
        <Switch
          id="cms-seo-noindex"
          checked={seo.noIndex}
          onCheckedChange={(checked) => patch({ noIndex: checked })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
