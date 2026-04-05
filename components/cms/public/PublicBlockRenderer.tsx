import type { PublicCmsBlock } from "@/lib/cms/public-page-types";

import { PUBLIC_BLOCK_REGISTRY } from "./public-block-registry";

function PublicBlockFallback({ block }: { block: PublicCmsBlock }) {
  if (block.sectionKey == null) {
    return (
      <div
        className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground"
        data-block-id={block.id}
      >
        Empty block (no section key).
      </div>
    );
  }
  return (
    <section
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
      data-block-id={block.id}
      data-section-key={block.sectionKey}
    >
      <p className="font-medium text-amber-800 dark:text-amber-200">
        No component in{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          PUBLIC_BLOCK_REGISTRY
        </code>{" "}
        for <code className="text-xs">{block.sectionKey}</code>
      </p>
      <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/50 p-2 text-xs">
        {JSON.stringify(block.content, null, 2)}
      </pre>
    </section>
  );
}

/**
 * Renders one public CMS block using {@link PUBLIC_BLOCK_REGISTRY} (Payload-style).
 */
export function PublicBlockRenderer({ block }: { block: PublicCmsBlock }) {
  if (block.sectionKey == null) {
    return <PublicBlockFallback block={block} />;
  }

  const render =
    PUBLIC_BLOCK_REGISTRY[block.sectionKey as keyof typeof PUBLIC_BLOCK_REGISTRY];
  if (render) {
    return <>{render({ block })}</>;
  }

  return <PublicBlockFallback block={block} />;
}

/**
 * Renders all blocks in `displayOrder` (API already sorts ascending).
 */
export function PublicBlocksList({ blocks }: { blocks: PublicCmsBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No blocks on this page.</p>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {blocks.map((block) => (
        <PublicBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
