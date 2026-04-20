import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CURRENT_PROJECT_COOKIE } from "@/lib/projects/current-project";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const redirectTo = url.searchParams.get("redirect")?.trim() || "/dashboard";
  if (!slug) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_PROJECT_COOKIE, slug, {
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
