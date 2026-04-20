import { cookies } from "next/headers";
import type { ProjectSummary } from "@/lib/projects/api";

export const CURRENT_PROJECT_COOKIE = "cms-project";

export async function getCurrentProjectFromRequest(
  projects: ProjectSummary[],
): Promise<ProjectSummary | null> {
  if (projects.length === 0) return null;
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get(CURRENT_PROJECT_COOKIE)?.value;
  return (
    projects.find((project) => project.slug === selectedSlug) ?? projects[0] ?? null
  );
}
