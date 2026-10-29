import { useEffect } from 'react';

function clearSelection(): void {
  window.getSelection()?.removeAllRanges();
}

/**
 * Drops a text selection on Escape and on the next press anywhere outside it.
 *
 * The browser normally collapses a selection when the user clicks elsewhere,
 * but most of this UI is `user-select: none`, and pressing inside such an
 * element leaves the old highlight standing. The press is only watched, never
 * swallowed, so the button under the cursor still fires on that same click.
 */
export function useSelectionDismiss(): void {
  useEffect(() => {
    function onPointerDown(event: MouseEvent): void {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      // A press that lands inside the selected text starts a new selection
      // there; the browser handles that case correctly on its own.
      const target = event.target as Node | null;
      if (target && selection.containsNode(target, true)) return;
      clearSelection();
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      // Escape clears the highlight first; a second press closes the dialog.
      event.stopPropagation();
      clearSelection();
    }

    window.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}
