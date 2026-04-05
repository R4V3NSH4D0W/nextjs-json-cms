import type { ReactNode } from "react";

import type {
  GeneratedPublicSectionKey,
  PublicContent_hero_section,
  PublicContent_home,
  PublicContent_section,
} from "@/lib/cms/generated/public-sections";
import type { PublicCmsBlock } from "@/lib/cms/public-page-types";

/**
 * Payload-style map: `sectionKey` from the public CMS API → React component.
 * Add an entry when `pnpm cms:gen-types` adds a new `GeneratedPublicSectionKey`.
 */
export type PublicBlockRenderFn = (props: { block: PublicCmsBlock }) => ReactNode;

export const PUBLIC_BLOCK_REGISTRY: Partial<
  Record<GeneratedPublicSectionKey, PublicBlockRenderFn>
> = {
  home: HomeSection,
  hero_section: HeroSectionBlock,
  section: SectionRootBlock,
};

function HomeSection({ block }: { block: PublicCmsBlock }) {
  if (block.sectionKey !== "home") return null;
  const { title, description, fuck } = block.content as PublicContent_home;
  return (
    <section
      className="w-full max-w-3xl rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
      data-block-id={block.id}
      data-section-key="home"
    >
      {fuck ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {fuck}
        </p>
      ) : null}
      {title ? (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      ) : null}
      {description ? (
        <div
          className="prose prose-sm dark:prose-invert mt-3 max-w-none text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : null}
    </section>
  );
}

function HeroSectionBlock({ block }: { block: PublicCmsBlock }) {
  if (block.sectionKey !== "hero_section") return null;
  const { title, badge } = block.content as PublicContent_hero_section;
  return (
    <section
      className="w-full max-w-3xl rounded-lg border border-border bg-muted/40 p-8 text-center"
      data-block-id={block.id}
      data-section-key="hero_section"
    >
      {badge ? (
        <span className="mb-3 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
          {badge}
        </span>
      ) : null}
      {title ? (
        <div
          className="text-balance text-3xl font-bold tracking-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      ) : null}
    </section>
  );
}

function SectionRootBlock({ block }: { block: PublicCmsBlock }) {
  if (block.sectionKey !== "section") return null;
  const inner = (block.content as PublicContent_section).hero_section;
  return (
    <section
      className="w-full max-w-3xl rounded-lg border border-border p-6"
      data-block-id={block.id}
      data-section-key="section"
    >
      {inner?.title ? (
        <h2 className="text-xl font-semibold">{inner.title}</h2>
      ) : null}
      {inner?.subtitle ? (
        <div
          className="prose prose-sm dark:prose-invert mt-2 max-w-none text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: inner.subtitle }}
        />
      ) : null}
    </section>
  );
}
