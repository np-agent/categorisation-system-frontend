"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EulaViewDialogProps = {
  open: boolean;
  text: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
};

export function EulaViewDialog({
  open,
  text,
  loading = false,
  error = null,
  onClose,
}: EulaViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>End User Licence Agreement</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(85vh-80px)] overflow-y-auto px-6 pb-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading agreement...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {text}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
