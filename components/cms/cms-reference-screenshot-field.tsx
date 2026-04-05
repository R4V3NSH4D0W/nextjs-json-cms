"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClipboardPaste, ImageIcon, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { absoluteApiUrl } from "@/lib/cms/absolute-url";
import { uploadCmsReferenceImage } from "@/lib/cms/reference-image-upload";
import {
  imageFileFromClipboard,
  isPasteTargetEditable,
  normalizeClipboardImageFile,
} from "@/lib/media/clipboard";
import { cn } from "@/lib/shared/utils";
import { MediaPickerModal } from "@/components/media/media-picker-modal";
import Image from "next/image";

function isValidReferenceUrl(raw: string): boolean {
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

export function CmsReferenceScreenshotField({
  value,
  onChange,
  inputId,
  label = "Reference screenshot (optional)",
  description,
  /** Parent renders the label (e.g. layout schema `FieldLabelLine`). */
  hideLabel = false,
  disabled = false,
  uploadStrategy = "immediate",
  deferredFile = null,
  onDeferredFileChange,
}: {
  value: string;
  onChange: (url: string) => void;
  inputId: string;
  label?: string;
  description?: ReactNode;
  hideLabel?: boolean;
  disabled?: boolean;
  uploadStrategy?: "immediate" | "deferred";
  deferredFile?: File | null;
  onDeferredFileChange?: (file: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deferredPreviewUrl, setDeferredPreviewUrl] = useState("");

  useEffect(() => {
    if (!deferredFile) {
      setDeferredPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(deferredFile);
    setDeferredPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [deferredFile]);

  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      if (uploadStrategy === "deferred") {
        onDeferredFileChange?.(file);
        toast.success("Image selected. It will upload when you save.");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadCmsReferenceImage(file);
        onChange(url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, onDeferredFileChange, uploadStrategy],
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processImageFile(file);
      e.target.value = "";
    },
    [processImageFile],
  );

  useEffect(() => {
    if (disabled || pickerOpen || uploading) return;
    const onPaste = (e: ClipboardEvent) => {
      if (isPasteTargetEditable(e.target)) return;
      const raw = imageFileFromClipboard(e.clipboardData);
      if (!raw) return;
      e.preventDefault();
      void processImageFile(normalizeClipboardImageFile(raw));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, pickerOpen, uploading, processImageFile]);

  const handleAddLink = useCallback(() => {
    const t = linkDraft.trim();
    if (!isValidReferenceUrl(t)) {
      toast.error("Enter a valid https URL or a path starting with /");
      return;
    }
    onDeferredFileChange?.(null);
    onChange(t);
    setLinkDraft("");
    toast.success("Link saved");
  }, [linkDraft, onChange, onDeferredFileChange]);

  const handleLibraryPick = useCallback(
    (urls: string[]) => {
      const first = urls[0]?.trim();
      if (!first) return;
      onDeferredFileChange?.(null);
      onChange(first);
      toast.success("Image selected from library");
    },
    [onChange, onDeferredFileChange]
  );

  const hasDeferredFile = uploadStrategy === "deferred" && !!deferredFile;
  const hasValue = Boolean(value.trim()) || hasDeferredFile;
  const previewSrc = hasDeferredFile ? deferredPreviewUrl : absoluteApiUrl(value.trim());

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      {!hideLabel ? (
        <div className="space-y-1">
          <Label htmlFor={inputId}>{label}</Label>
          {description ? (
            <div className="text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>
      ) : null}

      {hasValue ? (
        <div className="flex gap-3 rounded-md border bg-background p-3">
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
            <Image
              src={previewSrc}
              alt=""
              fill
              className="object-cover object-top"
              sizes="128px"
              unoptimized={hasDeferredFile}
            />
          
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="break-all font-mono text-[11px] leading-snug text-muted-foreground">
              {hasDeferredFile ? deferredFile?.name : value.trim()}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                if (hasDeferredFile) {
                  onDeferredFileChange?.(null);
                  return;
                }
                onChange("");
              }}
            >
              Remove image
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border border-dashed bg-muted/20 p-3",
          hasValue && "border-border"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            onChange={handleUpload}
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
            Upload image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            Choose from library
          </Button>
        </div>

        <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
          <ClipboardPaste className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Paste a screenshot with Ctrl+V / ⌘V when not typing in a field below.
        </p>

        <p className="text-center text-xs text-muted-foreground">or</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id={inputId}
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="Paste image URL or path (/uploads/…)"
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
            className="shrink-0 gap-1.5 sm:self-stretch"
            disabled={disabled}
            onClick={handleAddLink}
          >
            <Link2 className="h-4 w-4" />
            Add link
          </Button>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleLibraryPick}
        multiple={false}
      />
    </div>
  );
}

export function CmsReferenceScreenshotPreview({
  url,
  title = "Preview",
  emptyHint = "Upload an image, pick from the library, or add a link to see the mockup here.",
  className,
  /** Read-only image strip: no title bar or hint text — only the image (or empty frame). */
  imageOnly = false,
}: {
  url: string;
  title?: string;
  emptyHint?: string;
  className?: string;
  imageOnly?: boolean;
}) {
  const trimmed = url.trim();
  const src = trimmed ? absoluteApiUrl(trimmed) : "";

  return (
    <div
      className={cn(
        "flex min-h-[min(40vh,360px)] w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:sticky lg:top-4",
        className
      )}
    >
      {!imageOnly ? (
        <div className="shrink-0 border-b bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
      ) : null}
      {src ? (
        <div className="flex min-h-[240px] flex-1 items-center justify-center bg-muted/20 p-3">
          <Image
            src={src}
            alt=""
            width={1920}
            height={1080}
            className="max-h-[min(70vh,720px)] w-full max-w-full select-none object-contain object-top"
            draggable={false}
            sizes="(max-width: 1024px) 100vw, min(720px, 55vw)"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center px-4 py-12 text-center",
            imageOnly ? "gap-0" : "gap-2"
          )}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground/45" />
          {imageOnly ? null : (
            <p className="max-w-[28ch] text-sm text-muted-foreground">
              {emptyHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
