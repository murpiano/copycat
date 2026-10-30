import { useEffect } from 'react';

function hasSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed);
}

function clearSelection(): void {
  window.getSelection()?.removeAllRanges();
}

/**
 * Drops a text selection on Escape, on the next press anywhere, and when the
 * window loses focus.
 *
 * The browser normally collapses a selection when the user clicks elsewhere,
 * but most of this UI is `user-select: none`, and pressing inside such an
 * element leaves the old highlight standing. The press is only watched, never
 * swallowed, so the button under the cursor still fires on that same click —
 * and because the highlight is gone by the time the click lands, handlers that
 * skip clicks ending a drag-select see a clean slate and act normally.
 */
export function useSelectionDismiss(): void {
  useEffect(() => {
    function onPointerDown(): void {
      // Unconditional: a press inside the highlight starts a fresh selection
      // there anyway, so clearing first costs nothing and removes the special
      // case that used to leave the old highlight behind.
      if (hasSelection()) clearSelection();
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || !hasSelection()) return;
      // Escape clears the highlight first; a second press closes the dialog.
      event.stopPropagation();
      clearSelection();
    }

    function onWindowBlur(): void {
      // Clicking away from Copycat entirely also drops the highlight.
      if (hasSelection()) clearSelection();
    }

    window.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);
}
