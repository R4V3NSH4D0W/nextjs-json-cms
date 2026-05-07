/**
 * Origin the browser should use for absolute redirects.
 * In Docker, Node often binds 0.0.0.0 — `request.url` then yields a host browsers cannot open.
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    process.env.APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || "https";
    return `${proto}://${forwardedHost}`;
  }

  const reqUrl = new URL(request.url);
  const hostHeader = request.headers.get("host") || reqUrl.host;
  const host = normalizeBindHost(hostHeader);
  const scheme =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    reqUrl.protocol.replace(/:$/, "") ||
    "http";
  return `${scheme}://${host}`;
}

function normalizeBindHost(host: string): string {
  if (host.startsWith("0.0.0.0:")) return `localhost:${host.slice("0.0.0.0:".length)}`;
  if (host === "0.0.0.0") return "localhost";
  if (host.startsWith("[::]:")) return `localhost:${host.slice("[::]:".length)}`;
  if (host === "[::]") return "localhost";
  return host;
}
