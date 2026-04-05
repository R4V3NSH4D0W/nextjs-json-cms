import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve image URLs for Next/Image (local `/…` paths stay on the app origin). */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/file.svg";
  const trimmedPath = path.trim();
  if (!trimmedPath) return "/file.svg";
  if (trimmedPath.startsWith("blob:")) return trimmedPath;
  if (
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://")
  ) {
    return trimmedPath;
  }
  if (trimmedPath.startsWith("//")) return `https:${trimmedPath}`;
  if (trimmedPath.startsWith("/")) return trimmedPath;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmedPath)) {
    return `https://${trimmedPath}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const cleanPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}
