/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Overlay } from '../../../../src/renderer/components/Overlay';

function renderOverlay() {
  const onClose = jest.fn();
  const { container } = render(
    <Overlay onClose={onClose}>
      <div className="popup">
        <p>содержимое</p>
      </div>
    </Overlay>,
  );
  return { onClose, backdrop: container.querySelector('.overlay')! };
}

describe('Overlay', () => {
  it('closes when the backdrop itself is clicked', () => {
    const { onClose, backdrop } = renderOverlay();
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open when a drag that began inside ends on the backdrop', () => {
    const { onClose, backdrop } = renderOverlay();
    // Selecting text in the dialog and releasing outside it must not close it.
    fireEvent.mouseDown(screen.getByText('содержимое'));
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores clicks on the dialog itself', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByText('содержимое'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
