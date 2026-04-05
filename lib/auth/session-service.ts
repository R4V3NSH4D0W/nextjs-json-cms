import { cookies } from "next/headers";

import { getPrisma } from "@/lib/server/prisma";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_DAYS,
  sessionCookieOptions,
} from "./constants";
import { generateSessionToken } from "./token";

export async function createSession(userId: string): Promise<void> {
  const prisma = getPrisma();
  const id = generateSessionToken();
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.session.create({
    data: { id, userId, expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, id, sessionCookieOptions());
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await getPrisma()
      .session.deleteMany({ where: { id: token } })
      .catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
