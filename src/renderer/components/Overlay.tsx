import { useRef, type MouseEvent, type ReactNode } from 'react';

interface OverlayProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Dim backdrop that closes on a click of its own.
 *
 * The close fires only when the press *started* on the backdrop too. Otherwise
 * selecting text inside the dialog and releasing the button outside it — over
 * the backdrop, or past the window edge — would count as a click on the
 * backdrop and shut the dialog mid-selection.
 */
export function Overlay({ onClose, children }: OverlayProps) {
  const pressedBackdrop = useRef(false);

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    pressedBackdrop.current = event.target === event.currentTarget;
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (!pressedBackdrop.current) return;
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={handleMouseDown} onClick={handleClick}>
      {children}
    </div>
  );
}
