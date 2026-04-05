/**
 * Dev-only seed. Do not rely on these credentials in production.
 * Configure via env later if you need non-committed secrets.
 */
import "dotenv/config";

import { hashPassword } from "../lib/auth/password";
import { CmsSiteContentKey } from "../lib/generated/prisma/enums";
import { getPrisma } from "../lib/server/prisma";

const SEED_EMAIL =
  process.env.SEED_EMAIL?.trim() || "admin@example.com";
const SEED_PASSWORD = process.env.SEED_PASSWORD?.trim() || "changeme";

async function main() {
  const email = SEED_EMAIL.trim().toLowerCase();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const prisma = getPrisma();

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Seeded user: ${user.email} (id: ${user.id})`);

  const cmsDefaults: Record<
    (typeof CmsSiteContentKey)[keyof typeof CmsSiteContentKey],
    object
  > = {
    [CmsSiteContentKey.navigation]: { v: 1, items: [] },
    [CmsSiteContentKey.footer]: { v: 1, columns: [] },
    [CmsSiteContentKey.announcements]: { v: 1, items: [] },
  };

  for (const key of Object.values(CmsSiteContentKey)) {
    const payload = cmsDefaults[key];
    await prisma.cmsSiteContent.upsert({
      where: { key },
      create: { key, payload },
      update: { payload },
    });
    console.log(`Seeded CMS site content: ${key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
