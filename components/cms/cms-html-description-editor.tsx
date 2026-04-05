"use client";

import { useEffect, useMemo } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared/utils";

export interface CmsHtmlDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  /** For label association; forwarded to the editor wrapper. */
  id?: string;
  placeholder?: string;
  className?: string;
  /** Tighter toolbar + min height for layout builder defaults. */
  variant?: "default" | "compact";
}

export function CmsHtmlDescriptionEditor({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = "Write something…",
  className,
  variant = "default",
}: CmsHtmlDescriptionEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
          },
        },
        underline: {},
      }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value ?? "";
    const current = editor.getHTML();
    if (current === next) return;
    const wantEmpty = !next.trim();
    if (wantEmpty && editor.isEmpty) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  const compact = variant === "compact";
  const btnClass = compact ? "h-7 w-7 px-0" : "h-8 w-8 px-0";

  return (
    <div
      id={id}
      className={cn(
        "min-w-0 overflow-hidden rounded-md border border-input bg-background shadow-xs",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      {editor ? (
        <div
          className={cn(
            "flex flex-wrap gap-0.5 border-b border-border bg-muted/40 p-1",
            compact && "gap-0"
          )}
          role="toolbar"
          aria-label="Formatting"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(btnClass, editor.isActive("bold") && "bg-muted")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-pressed={editor.isActive("bold")}
            aria-label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(btnClass, editor.isActive("italic") && "bg-muted")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-pressed={editor.isActive("italic")}
            aria-label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("underline") && "bg-muted"
            )}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-pressed={editor.isActive("underline")}
            aria-label="Underline"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("heading", { level: 2 }) && "bg-muted"
            )}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-pressed={editor.isActive("heading", { level: 2 })}
            aria-label="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("heading", { level: 3 }) && "bg-muted"
            )}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-pressed={editor.isActive("heading", { level: 3 })}
            aria-label="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("bulletList") && "bg-muted"
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-pressed={editor.isActive("bulletList")}
            aria-label="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("orderedList") && "bg-muted"
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-pressed={editor.isActive("orderedList")}
            aria-label="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              btnClass,
              editor.isActive("blockquote") && "bg-muted"
            )}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-pressed={editor.isActive("blockquote")}
            aria-label="Quote"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={btnClass}
            onClick={() => {
              const prev = editor.getAttributes("link").href as
                | string
                | undefined;
              const next = window.prompt("Link URL", prev ?? "https://");
              if (next === null) return;
              if (next === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: next })
                .run();
            }}
            aria-label="Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={btnClass}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={btnClass}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-b border-border bg-muted/20",
            compact ? "h-[33px]" : "h-[41px]"
          )}
        />
      )}
      {editor ? (
        <EditorContent
          editor={editor}
          className={cn(
            "cms-html-description-editor [&_.ProseMirror]:min-h-[var(--cms-html-min-h,140px)] [&_.ProseMirror]:max-w-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic",
            compact &&
              "[--cms-html-min-h:96px] [&_.ProseMirror]:min-h-[96px] [&_.ProseMirror]:text-xs"
          )}
        />
      ) : (
        <div
          className={cn(
            "animate-pulse bg-muted/30",
            compact ? "min-h-[96px]" : "min-h-[140px]"
          )}
        />
      )}
    </div>
  );
}
