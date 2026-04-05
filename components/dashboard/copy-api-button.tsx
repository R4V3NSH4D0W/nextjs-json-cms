"use client";

import { useState } from "react";

export function CopyApiButton({
  absoluteUrl,
  label = "Copy API URL",
}: {
  absoluteUrl: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(absoluteUrl).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
