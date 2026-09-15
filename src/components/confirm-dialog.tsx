import { useEffect, useRef, useState, useId } from 'react';

import { Button } from '@/components/ui/button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      setError(null);
      triggerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClose={() => {
        triggerRef.current?.focus();
      }}
    >
      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h2
            id={titleId}
            className="text-lg font-semibold"
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
        </div>
        {error ? (
          <p
            role="alert"
            className="text-destructive text-sm"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                await onConfirm();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Operation failed. Try again.');
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
