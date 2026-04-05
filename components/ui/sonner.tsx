"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group border-border bg-popover text-popover-foreground shadow-lg",
        },
      }}
    />
  );
}
