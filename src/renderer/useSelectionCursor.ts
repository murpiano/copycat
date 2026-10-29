import { useCallback, useEffect, useRef, useState } from 'react';

export interface SelectionCursor<T extends HTMLElement> {
  /** True once a drag has actually highlighted something inside the node. */
  selecting: boolean;
  ref: (node: T | null) => void;
}

/**
 * Keeps the pointer cursor on selectable content until text is really being
 * highlighted, so a card still reads as one big button.
 *
 * `selectstart` is no use as the trigger: Chromium fires it on every mousedown
 * inside selectable text, so a plain click would flash the caret. What marks a
 * real drag is the selection turning non-empty while the button is held.
 */
export function useSelectionCursor<T extends HTMLElement>(): SelectionCursor<T> {
  const [selecting, setSelecting] = useState(false);
  const nodeRef = useRef<T | null>(null);
  const pressed = useRef(false);

  const ref = useCallback((node: T | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    function onMouseDown(event: MouseEvent): void {
      pressed.current = nodeRef.current?.contains(event.target as Node) ?? false;
    }

    function onSelectionChange(): void {
      if (!pressed.current) return;
      const selection = window.getSelection();
      setSelecting(Boolean(selection && !selection.isCollapsed));
    }

    function onRelease(): void {
      pressed.current = false;
      setSelecting(false);
    }

    window.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('selectionchange', onSelectionChange);
    // The drag can end anywhere, including outside the element or the window.
    window.addEventListener('mouseup', onRelease);
    window.addEventListener('blur', onRelease);
    return () => {
      window.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('mouseup', onRelease);
      window.removeEventListener('blur', onRelease);
    };
  }, []);

  return { selecting, ref };
}
