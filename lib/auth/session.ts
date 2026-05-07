import { cookies } from "next/headers";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "session";

export type AppUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export type AppSession = {
  user: AppUser;
} | null;

function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000"
  );
}

export async function isRegistrationOpen(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/api/auth/register/status`, {
      cache: "no-store",
    });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      success: boolean;
      registrationOpen?: boolean;
    };
    return Boolean(data.success && data.registrationOpen);
  } catch {
    return false;
  }
}

/**
 * Current session — validated by calling the Hono backend's GET /api/auth/me.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function getSession(): Promise<AppSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${getApiUrl()}/api/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      // Disable Next.js caching — session must always be fresh
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      success: boolean;
      user?: AppUser;
    };

    if (!data.success || !data.user) return null;
    return { user: data.user };
  } catch {
    return null;
  }
}
