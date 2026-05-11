"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AlertDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmationText?: string;
  confirmationLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void | Promise<void>;
};

export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
  confirmationText,
  confirmationLabel,
  onOpenChange,
  onConfirm,
}: AlertDialogProps) {
  const [confirmationDraft, setConfirmationDraft] = useState("");
  const expectedConfirmation = confirmationText?.trim() ?? "";
  const requiresConfirmation = expectedConfirmation.length > 0;
  const confirmationMatches =
    !requiresConfirmation || confirmationDraft.trim() === expectedConfirmation;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setConfirmationDraft("");
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!confirmationMatches) return;
    if (onConfirm) {
      await onConfirm();
    }
    setConfirmationDraft("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requiresConfirmation ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {confirmationLabel ?? "Type the text below to confirm."}
            </p>
            <code className="block rounded-md bg-muted px-3 py-2 text-sm">
              {expectedConfirmation}
            </code>
            <Input
              value={confirmationDraft}
              onChange={(event) => setConfirmationDraft(event.target.value)}
              placeholder={expectedConfirmation}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ) : null}
        <DialogFooter>
          {onConfirm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={!confirmationMatches}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
