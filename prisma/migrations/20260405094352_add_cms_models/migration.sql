-- CreateEnum
CREATE TYPE "CmsSiteContentKey" AS ENUM ('navigation', 'footer', 'announcements');

-- CreateTable
CREATE TABLE "cms_layouts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rootKey" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "referenceImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "layoutId" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blocks" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_site_content" (
    "id" TEXT NOT NULL,
    "key" "CmsSiteContentKey" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_site_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

-- CreateIndex
CREATE INDEX "cms_blocks_pageId_idx" ON "cms_blocks"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_site_content_key_key" ON "cms_site_content"("key");

-- AddForeignKey
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "cms_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blocks" ADD CONSTRAINT "cms_blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "cms_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
