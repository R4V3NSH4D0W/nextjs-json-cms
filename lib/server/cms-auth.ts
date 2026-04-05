import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export async function requireCmsSession(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  return { ok: true };
}
