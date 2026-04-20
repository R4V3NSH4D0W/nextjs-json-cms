"use client";

import { useMutation, useQuery, useQueryClient } from "@/lib/shared/react-query";
import {
  ArrowLeft,
  ClipboardPaste,
  Folder,
  FolderPlus,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/fetcher";
import {
  imageFileFromClipboard,
  isPasteTargetEditable,
  normalizeClipboardImageFile,
} from "@/lib/media/clipboard";
import { getImageUrl } from "@/lib/shared/utils";

interface MediaLibraryResponse {
  folders: string[];
  files: {
    id: string;
    name: string;
    url: string;
  }[];
}

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("/");
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteUploadRef = useRef(false);

  const { data, isLoading } = useQuery<MediaLibraryResponse>({
    queryKey: ["media-gallery", currentPath],
    queryFn: async () => {
      return api.get<MediaLibraryResponse>(`/api/v1/admin/media/gallery/list`, {
        params: { folder: currentPath },
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return api.post(`/api/v1/admin/media/gallery/folder`, {
        name,
        parent: currentPath,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media-gallery"] });
      setIsNewFolderOpen(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const fullPath =
        currentPath === "/" ? folderName : `${currentPath}/${folderName}`;
      return api.delete(
        `/api/v1/admin/media/gallery/folder?folder=${encodeURIComponent(fullPath)}`,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media-gallery"] });
      toast.success("Folder deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(
        `/api/v1/admin/media/gallery/upload?folder=${encodeURIComponent(currentPath)}`,
        formData,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media-gallery"] });
      if (pasteUploadRef.current) {
        pasteUploadRef.current = false;
        toast.success("Image pasted from clipboard");
      } else {
        toast.success("File uploaded");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) => {
      pasteUploadRef.current = false;
      toast.error(e.message);
    },
  });

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (uploadMutation.isPending) return;
      if (isPasteTargetEditable(e.target)) return;
      const file = imageFileFromClipboard(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      pasteUploadRef.current = true;
      uploadMutation.mutate(normalizeClipboardImageFile(file));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadMutation.mutate, uploadMutation.isPending]);

  const deleteFileMutation = useMutation({
    mutationFn: async (file: { id: string; url: string }) => {
      return api.delete(
        `/api/v1/admin/media/gallery/file?url=${encodeURIComponent(file.url)}`,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media-gallery"] });
      toast.success("Image deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleNavigate = (folderName: string) => {
    const newPath =
      currentPath === "/" ? folderName : `${currentPath}/${folderName}`;
    setCurrentPath(newPath);
  };

  const handleUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/");
    parts.pop();
    const parent = parts.join("/") || "/";
    setCurrentPath(parent);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {currentPath !== "/" && (
            <Button variant="ghost" size="icon" onClick={handleUp}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Media
            </h1>
            <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
              {currentPath}
            </p>
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
              <ClipboardPaste className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Paste a screenshot or image with{" "}
                <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
                  Ctrl
                </kbd>
                {" + "}
                <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
                  V
                </kbd>
                {" / "}
                <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
                  ⌘V
                </kbd>{" "}
                to upload into this folder.
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="mr-2 h-4 w-4" />
                New folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New folder</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      createFolderMutation.mutate(newFolderName.trim());
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createFolderMutation.mutate(newFolderName)}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploadMutation.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      <Card className="min-h-0 flex-1 border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-16 text-center text-sm">
              Loading…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {folders.map((folder) => (
                <div
                  key={folder}
                  className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                  onClick={() => handleNavigate(folder)}
                >
                  <Folder
                    className="h-16 w-16 fill-blue-500/20 text-blue-500"
                    strokeWidth={1}
                  />
                  <span className="w-full truncate text-center text-xs font-medium">
                    {folder}
                  </span>
                  <div
                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => deleteFolderMutation.mutate(folder)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-background/90"
                          disabled={deleteFileMutation.isPending}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            deleteFileMutation.mutate({
                              id: file.id,
                              url: file.url,
                            })
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={getImageUrl(file.url)}
                      alt={file.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
                      quality={70}
                      className="object-cover"
                    />
                  </div>
                  <div className="border-t border-border bg-card p-2">
                    <p className="truncate text-xs" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                </div>
              ))}

              {folders.length === 0 && files.length === 0 && (
                <div className="text-muted-foreground col-span-full py-16 text-center text-sm">
                  This folder is empty.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
