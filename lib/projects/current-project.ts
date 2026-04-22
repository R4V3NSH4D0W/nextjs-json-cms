import { cookies } from "next/headers";
import type { ProjectSummary } from "@/lib/projects/api";

export const CURRENT_PROJECT_COOKIE = "cms-project";

export async function getCurrentProjectFromRequest(
  projects: ProjectSummary[],
): Promise<ProjectSummary | null> {
  if (projects.length === 0) return null;
  const activeProjects = projects.filter((project) => project.status === "active");
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get(CURRENT_PROJECT_COOKIE)?.value;
  const selectedProject = projects.find((project) => project.slug === selectedSlug) ?? null;

  if (selectedProject?.status === "active") return selectedProject;
  if (activeProjects.length > 0) return activeProjects[0] ?? null;
  return selectedProject ?? projects[0] ?? null;
}
