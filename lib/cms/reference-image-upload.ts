import { api } from "@/lib/api/admin-client";

function parseUploadUrl(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const o = res as Record<string, unknown>;
  if (typeof o.url === "string" && o.url) return o.url;
  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (typeof d.url === "string" && d.url) return d.url;
  }
  if (o.file && typeof o.file === "object") {
    const f = o.file as Record<string, unknown>;
    if (typeof f.url === "string" && f.url) return f.url;
  }
  return null;
}

/**
 * Uploads a reference screenshot to the media gallery under folder `cms`
 * (stored under `assets/uploads/cms/…`, served at `/api/media/...`).
 */
export async function uploadCmsReferenceImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<unknown>(
    `/api/v1/admin/media/gallery/upload?folder=${encodeURIComponent("cms")}`,
    formData
  );
  const url = parseUploadUrl(res);
  if (!url) {
    throw new Error("Upload did not return a URL");
  }
  return url;
}
