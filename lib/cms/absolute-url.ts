/**
 * Builds a browser-usable URL for API-hosted paths (e.g. `/uploads/cms/x.jpg`).
 */
export function absoluteApiUrl(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) return "";
  if (
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://") ||
    trimmedPath.startsWith("blob:") ||
    trimmedPath.startsWith("data:")
  ) {
    return trimmedPath;
  }
  if (trimmedPath.startsWith("//")) return `https:${trimmedPath}`;

  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";
  const normalizedBase = rawBase.replace(/\/$/, "");
  const baseWithProtocol = normalizedBase
    ? /^(https?:)?\/\//i.test(normalizedBase)
      ? normalizedBase
      : `https://${normalizedBase}`
    : "";
  const baseUrl = baseWithProtocol ? new URL(baseWithProtocol) : null;
  const baseHost = baseUrl?.host.toLowerCase() ?? "";
  const baseProtocol = baseUrl?.protocol ?? "https:";

  // Handle host/path inputs from media library, e.g. "backend.devfy.codes/uploads/x.svg".
  const hostPathMatch = trimmedPath.match(
    /^([a-z0-9.-]+\.[a-z]{2,})(\/.*)?$/i
  );
  if (hostPathMatch) {
    const host = hostPathMatch[1].toLowerCase();
    const suffix = hostPathMatch[2] || "";
    const dedupedSuffix =
      baseHost && suffix.startsWith(`/${baseHost}/`)
        ? suffix.slice(baseHost.length + 1)
        : suffix;
    const protocol = host === baseHost ? baseProtocol : "https:";
    return `${protocol}//${host}${dedupedSuffix}`;
  }

  if (!baseWithProtocol) {
    return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  }
  return trimmedPath.startsWith("/")
    ? `${baseWithProtocol}${trimmedPath}`
    : `${baseWithProtocol}/${trimmedPath}`;
}
