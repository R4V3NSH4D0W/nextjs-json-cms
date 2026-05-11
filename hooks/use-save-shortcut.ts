"use client";

import { useEffect, useRef } from "react";

type SaveShortcutOptions = {
  enabled?: boolean;
};

export function useSaveShortcut(
  onSave: () => void | Promise<void>,
  options: SaveShortcutOptions = {},
) {
  const { enabled = true } = options;
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isSave = (event.metaKey || event.ctrlKey) && key === "s";
      if (!isSave) return;
      event.preventDefault();
      void onSaveRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
