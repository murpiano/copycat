import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps the pointer cursor on selectable content until a selection actually
 * starts, so a card still reads as one big button. CSS cannot tell a click
 * from the beginning of a drag-select, and React has no synthetic
 * `selectstart`, so the listener is attached to the node by hand.
 */
export function useSelectionCursor<T extends HTMLElement>(): {
  selecting: boolean;
  ref: (node: T | null) => void;
} {
  const [selecting, setSelecting] = useState(false);
  const nodeRef = useRef<T | null>(null);

  const ref = useCallback((node: T | null) => {
    const start = (): void => setSelecting(true);
    if (nodeRef.current) nodeRef.current.removeEventListener('selectstart', start);
    nodeRef.current = node;
    node?.addEventListener('selectstart', start);
  }, []);

  useEffect(() => {
    if (!selecting) return;
    const stop = (): void => setSelecting(false);
    // The drag can end anywhere, including outside the element or the window.
    window.addEventListener('mouseup', stop);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('blur', stop);
    };
  }, [selecting]);

  return { selecting, ref };
}
