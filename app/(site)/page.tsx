import { PublicBlocksList } from "@/components/cms/public/PublicBlockRenderer";
import { fetchPublicCmsPageBySlug } from "@/lib/cms/fetch-public-page";
import {
  publicPageBlocks,
  type PublicPageResponse,
} from "@/lib/cms/public-page-types";

export default async function Home() {
  let page: PublicPageResponse["page"] | null = null;
  try {
    page = await fetchPublicCmsPageBySlug("home");
  } catch {
    // ignore — e.g. no server during static analysis
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-6 py-16 text-foreground">
      <p className="mb-10 max-w-xl text-center text-sm text-muted-foreground">
        Storefront blocks use a Payload-style registry:{" "}
        <code className="text-xs">
          components/cms/public/public-block-registry.tsx
        </code>
        . Other CMS routes use{" "}
        <code className="text-xs">app/(site)/[slug]/page.tsx</code>. Regenerate
        types with <code className="text-xs">pnpm cms:gen-types</code> when
        layouts change.
      </p>

      {page ? (
        <>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Page <strong>{page.slug}</strong> · {page.blocks.length} block
            {page.blocks.length === 1 ? "" : "s"}
          </p>
          <PublicBlocksList blocks={publicPageBlocks(page)} />
        </>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          No published page with slug <code>home</code> — create one in the
          dashboard.
        </p>
      )}
    </main>
  );
}
