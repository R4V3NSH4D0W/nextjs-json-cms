"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AlertDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
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
  onOpenChange,
  onConfirm,
}: AlertDialogProps) {
  async function handleConfirm() {
    if (onConfirm) {
      await onConfirm();
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {onConfirm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
