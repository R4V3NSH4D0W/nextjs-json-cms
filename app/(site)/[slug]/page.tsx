import { notFound } from "next/navigation";

import { PublicBlocksList } from "@/components/cms/public/PublicBlockRenderer";
import { fetchPublicCmsPageBySlug } from "@/lib/cms/fetch-public-page";
import { publicPageBlocks } from "@/lib/cms/public-page-types";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CmsDynamicPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) notFound();

  const page = await fetchPublicCmsPageBySlug(slug);
  if (!page) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-6 py-16 text-foreground">
      <header className="mb-10 w-full max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">/{page.slug}</span>
        </p>
      </header>

      <PublicBlocksList blocks={publicPageBlocks(page)} />
    </main>
  );
}
