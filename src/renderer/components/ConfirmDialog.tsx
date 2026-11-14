import { Overlay } from './Overlay';
import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
}

/**
 * Asked before unsaved work is thrown away. It has no backdrop dismissal of
 * its own: leaving by a stray click is exactly what this guards against, so
 * the answer has to be one of the two buttons.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
  busy = false,
  error,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const messageId = useId();
  useEffect(() => {
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const buttons = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      if (!buttons.length) {
        event.preventDefault();
        return;
      }
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', trapFocus, true);
    return () => {
      window.removeEventListener('keydown', trapFocus, true);
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, []);
  return (
    <Overlay onClose={() => {}}>
      <div
        ref={dialogRef}
        className="popup confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={messageId}
        aria-busy={busy}
      >
        <div className="popup-head">
          <div className="popup-title">{title}</div>
        </div>
        <p id={messageId} className="confirm-message">
          {message}
        </p>
        {error && (
          <p className="field-hint" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button ghost"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'button danger' : 'button primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
