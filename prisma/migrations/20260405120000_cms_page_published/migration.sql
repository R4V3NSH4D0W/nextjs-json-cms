-- Split storefront visibility (`published`) from CMS enabled (`isActive`).
-- Old `isActive` meant both; copy to `published`, then set `isActive` = true for all rows.
-- Idempotent: safe if `published` already exists (e.g. partial apply).

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cms_pages'
      AND column_name = 'published'
  ) THEN
    ALTER TABLE "cms_pages" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
  END IF;
END
$migration$;

UPDATE "cms_pages" SET "published" = "isActive";

UPDATE "cms_pages" SET "isActive" = true;

ALTER TABLE "cms_pages" ALTER COLUMN "published" SET DEFAULT false;
