"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/** Base URL for the Hono backend API. Same-process rewrites handle /api/* in production. */
function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000"
  );
}

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "";
  }
  return raw;
}

export type AuthFormState = { error?: string };

export async function loginAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(
    (formData.get("callbackUrl") as string | null) ?? null,
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const res = await fetch(`${getApiUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    success: boolean;
    message?: string;
    user?: {
      id: string;
      email: string;
      isAdmin: boolean;
      userType?: "super_admin" | "admin" | "member";
    };
  };

  if (!res.ok || !data.success) {
    return { error: data.message ?? "Invalid email or password." };
  }

  // Forward the Set-Cookie header from Hono to the browser
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const cookieStore = await cookies();
    // Parse and set each cookie segment
    for (const part of setCookie.split(/,(?=[^ ])/)) {
      const [pair, ...opts] = part.trim().split(";");
      const [name, ...valueParts] = (pair ?? "").split("=");
      if (!name) continue;
      const value = valueParts.join("=");
      const optMap: Record<string, string | boolean> = {};
      for (const opt of opts) {
        const [k, v] = opt.trim().split("=");
        optMap[(k ?? "").toLowerCase()] = v ?? true;
      }
      cookieStore.set(name.trim(), value, {
        httpOnly: true,
        sameSite: "lax",
        path: (optMap["path"] as string) || "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: optMap["max-age"] ? Number(optMap["max-age"]) : undefined,
      });
    }
  }

  if (data.user?.isAdmin) {
    redirect("/admin");
  }
  redirect(callbackUrl || "/dashboard");
}

export async function registerAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const res = await fetch(`${getApiUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    success: boolean;
    message?: string;
    user?: {
      id: string;
      email: string;
      isAdmin: boolean;
      userType?: "super_admin" | "admin" | "member";
    };
  };

  if (!res.ok || !data.success) {
    return {
      error:
        data.message ??
        "Registration is closed. Sign in with an existing account.",
    };
  }

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const cookieStore = await cookies();
    for (const part of setCookie.split(/,(?=[^ ])/)) {
      const [pair, ...opts] = part.trim().split(";");
      const [name, ...valueParts] = (pair ?? "").split("=");
      if (!name) continue;
      const value = valueParts.join("=");
      const optMap: Record<string, string | boolean> = {};
      for (const opt of opts) {
        const [k, v] = opt.trim().split("=");
        optMap[(k ?? "").toLowerCase()] = v ?? true;
      }
      cookieStore.set(name.trim(), value, {
        httpOnly: true,
        sameSite: "lax",
        path: (optMap["path"] as string) || "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: optMap["max-age"] ? Number(optMap["max-age"]) : undefined,
      });
    }
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  // Forward the session cookie to Hono for server-side deletion
  const cookieStore = await cookies();
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(cookieName)?.value;

  await fetch(`${getApiUrl()}/api/auth/logout`, {
    method: "POST",
    headers: token ? { cookie: `${cookieName}=${token}` } : {},
  }).catch(() => {});

  cookieStore.delete(cookieName);
  redirect("/login");
}
