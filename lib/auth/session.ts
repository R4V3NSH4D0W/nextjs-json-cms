import { cookies } from "next/headers";

import { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/server/prisma";

import { SESSION_COOKIE_NAME } from "./constants";

export type AppUser = {
  id: string;
  email: string;
};

export type AppSession = {
  user: AppUser;
} | null;

/**
 * Current session from httpOnly cookie + Postgres.
 * Use in Server Components, Route Handlers, and Server Actions (not in `proxy.ts`).
 */
export async function getSession(): Promise<AppSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const prisma = getPrisma();
  let row;
  try {
    row = await prisma.session.findUnique({
      where: { id: token },
      include: { user: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P1003"
    ) {
      throw new Error(
        'PostgreSQL database does not exist. Run `pnpm db:ensure` then `pnpm db:migrate` (see README.md).',
      );
    }
    throw e;
  }

  if (!row) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (row.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    user: {
      id: row.user.id,
      email: row.user.email,
    },
  };
}
