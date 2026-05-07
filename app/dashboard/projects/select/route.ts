import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/http/public-origin";
import { CURRENT_PROJECT_COOKIE } from "@/lib/projects/current-project";
import type { ProjectSummary } from "@/lib/projects/api";

function safeRelativeRedirect(raw: string): string {
  const path = raw.trim() || "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const redirectTo = safeRelativeRedirect(
    url.searchParams.get("redirect")?.trim() || "/dashboard",
  );
  const redirectUrl = new URL(redirectTo, `${getPublicOrigin(request)}/`);

  if (!slug) {
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = await cookies();
  const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookie)?.value ?? "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

  let canSelectSlug = false;
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/projects`, {
      headers: token ? { cookie: `${sessionCookie}=${token}` } : undefined,
      cache: "no-store",
    });
    const data = res.ok
      ? ((await res.json()) as { projects?: ProjectSummary[] })
      : { projects: [] };
    const projects = data.projects ?? [];
    canSelectSlug = projects.some(
      (project) => project.slug === slug && project.status === "active",
    );
  } catch {
    canSelectSlug = false;
  }

  if (!canSelectSlug) {
    return NextResponse.redirect(redirectUrl);
  }

  cookieStore.set(CURRENT_PROJECT_COOKIE, slug, {
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });

  return NextResponse.redirect(redirectUrl);
}
