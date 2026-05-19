"use client";

import { useCallback, useRef, useState } from "react";
import {
  FolderOpen,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@/lib/shared/react-query";
import { api } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { absoluteApiUrl } from "@/lib/cms/absolute-url";
import { uploadCmsIconImage } from "@/lib/cms/file-upload";
import { cn } from "@/lib/shared/utils";
import { useCurrentProject } from "@/components/providers/current-project-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServerFile {
  id: string;
  name: string;
  url: string;
  ext: string;
  size?: number;
}

interface IconsListResponse {
  success: boolean;
  files: ServerFile[];
}

type Tab = "upload" | "library" | "url";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ICON_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.svg,.avif,.ico,image/*";

function guessFilename(url: string): string {
  try {
    const parts = new URL(url, "http://x").pathname.split("/");
    const last = parts[parts.length - 1] ?? "";
    return decodeURIComponent(last).replace(/^\d+-[a-z0-9]+-/i, "") || "icon";
  } catch {
    return "icon";
  }
}

function isValidImageUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (t.startsWith("/")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CmsIconImageUploadField({
  value,
  onChange,
  inputId,
  label = "Icon image",
  hideLabel = false,
  disabled = false,
}: {
  value: string;
  onChange: (url: string) => void;
  inputId: string;
  label?: string;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  const { currentProject } = useCurrentProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [tab, setTab] = useState<Tab>("upload");

  // Fetch server icon files when library tab is active
  const iconsQuery = useQuery({
    queryKey: ["media-icons", currentProject?.slug],
    queryFn: () =>
      api.get<IconsListResponse>(
        `/api/v1/admin/projects/${currentProject!.slug}/media/gallery/icons/list`,
      ),
    enabled: !!currentProject && tab === "library",
    staleTime: 30_000,
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      if (!file.type.startsWith("image/") && !file.name.endsWith(".ico") && !file.name.endsWith(".svg")) {
        toast.error("Please choose an image file (PNG, SVG, WebP, ICO, etc.).");
        return;
      }

      const slug = currentProject?.slug;
      if (!slug) {
        toast.error("Project context not found. Please refresh and try again.");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadCmsIconImage(file, slug);
        onChange(url);
        toast.success(`"${file.name}" uploaded successfully`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, currentProject?.slug],
  );

  const handleAddLink = useCallback(() => {
    const t = linkDraft.trim();
    if (!isValidImageUrl(t)) {
      toast.error("Enter a valid https URL or a path starting with /");
      return;
    }
    onChange(t);
    setLinkDraft("");
    toast.success("Icon URL saved");
  }, [linkDraft, onChange]);

  const handleLibraryPick = useCallback(
    (file: ServerFile) => {
      onChange(file.url);
      toast.success(`"${file.name}" selected`);
    },
    [onChange],
  );

  const hasValue = Boolean(value.trim());
  const absoluteUrl = hasValue ? absoluteApiUrl(value.trim()) : "";
  const filename = hasValue ? guessFilename(value.trim()) : "";

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      {!hideLabel ? <Label htmlFor={inputId}>{label}</Label> : null}

      {/* Current icon preview */}
      {hasValue ? (
        <div className="flex items-center gap-3 rounded-md border bg-background p-3">
          {/* Thumbnail */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={absoluteUrl}
              alt={filename}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate font-mono text-[11px] leading-snug text-foreground"
              title={value.trim()}
            >
              {filename}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <a
                href={absoluteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Open
              </a>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled}
                onClick={() => onChange("")}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab strip */}
      <div className="flex gap-0.5 rounded-md border bg-muted/30 p-0.5">
        {(
          [
            { key: "upload" as const, label: "Upload icon", icon: ImageIcon },
            { key: "library" as const, label: "From library", icon: FolderOpen },
            { key: "url" as const, label: "Paste URL", icon: null },
          ]
        ).map(({ key, label: tabLabel, icon: Icon }) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-3 w-3 shrink-0" />}
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="flex flex-col gap-2 rounded-md border border-dashed bg-muted/20 p-3">
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            aria-hidden
            onChange={handleFileChange}
            accept={ICON_ACCEPT}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : hasValue ? "Replace icon" : "Choose icon"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            PNG, SVG, WebP, ICO, GIF — image files only. Max 10 MB. Stored in{" "}
            <span className="font-mono">/icon</span> folder.
          </p>
        </div>
      )}

      {/* From library tab */}
      {tab === "library" && (
        <div className="rounded-md border bg-background">
          {iconsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading icons…
            </div>
          ) : iconsQuery.isError ? (
            <p className="px-3 py-4 text-xs text-destructive">
              Failed to load icons. Is the backend running?
            </p>
          ) : !iconsQuery.data?.files?.length ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No icons uploaded yet. Use the{" "}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => setTab("upload")}
              >
                Upload icon
              </button>{" "}
              tab to add one.
            </div>
          ) : (
            <ul className="max-h-64 divide-y overflow-y-auto">
              {iconsQuery.data.files.map((file) => {
                const isSelected = value === file.url;
                const thumbUrl = absoluteApiUrl(file.url);
                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleLibraryPick(file)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/50",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      {/* Thumbnail */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl}
                          alt={file.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium leading-snug">
                          {file.name.replace(/^\d+-[a-z0-9]+-/i, "")}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {file.ext.toUpperCase()}
                          {file.size ? ` · ${formatBytes(file.size)}` : ""}
                          {isSelected ? " · Selected" : ""}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] font-semibold text-primary">✓</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Paste URL tab */}
      {tab === "url" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id={inputId}
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://… or /api/media/…"
            spellCheck={false}
            autoComplete="off"
            disabled={disabled}
            className="min-w-0 flex-1 font-mono text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 sm:self-stretch"
            disabled={disabled}
            onClick={handleAddLink}
          >
            Use URL
          </Button>
        </div>
      )}
    </div>
  );
}
