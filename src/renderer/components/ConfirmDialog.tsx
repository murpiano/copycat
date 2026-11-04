import { Overlay } from './Overlay';

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
  return (
    <Overlay onClose={() => {}}>
      <div className="popup confirm-dialog" role="alertdialog" aria-label={title} aria-busy={busy}>
        <div className="popup-head">
          <div className="popup-title">{title}</div>
        </div>
        <p className="confirm-message">{message}</p>
        {error && <p className="field-hint" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? 'button danger' : 'button primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
