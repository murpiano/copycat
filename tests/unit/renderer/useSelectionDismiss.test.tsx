/**
 * @jest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/react';
import { useSelectionDismiss } from '../../../src/renderer/useSelectionDismiss';

function Harness() {
  useSelectionDismiss();
  return (
    <div>
      <p data-testid="text">выделяемый текст</p>
      <button data-testid="target">кнопка</button>
    </div>
  );
}

function fakeSelection(overrides: Partial<Selection> = {}) {
  const removeAllRanges = jest.fn();
  jest.spyOn(window, 'getSelection').mockReturnValue({
    isCollapsed: false,
    containsNode: () => false,
    removeAllRanges,
    ...overrides,
  } as unknown as Selection);
  return removeAllRanges;
}

afterEach(() => jest.restoreAllMocks());

describe('useSelectionDismiss', () => {
  it('keeps the excerpt for a right-click inside its highlighted rectangle', () => {
    const removeAllRanges = fakeSelection({
      rangeCount: 1,
      getRangeAt: () => ({ getClientRects: () => [{ left: 10, right: 100, top: 10, bottom: 30 }] }) as unknown as Range,
    });
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseDown(getByTestId('text'), { button: 2, clientX: 20, clientY: 20 });
    expect(removeAllRanges).not.toHaveBeenCalled();
    fireEvent.mouseDown(getByTestId('text'), { button: 2, clientX: 110, clientY: 20 });
    expect(removeAllRanges).toHaveBeenCalledTimes(1);
  });
  it('drops the highlight when a press lands outside it', () => {
    const removeAllRanges = fakeSelection();
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseDown(getByTestId('target'));
    expect(removeAllRanges).toHaveBeenCalled();
  });

  it('drops the highlight even when the press lands on the text itself', () => {
    // Pressing inside the old highlight used to be skipped, which left it
    // standing and cost the user a second click.
    const removeAllRanges = fakeSelection({ containsNode: () => true });
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseDown(getByTestId('text'));
    expect(removeAllRanges).toHaveBeenCalled();
  });

  it('drops the highlight when the window loses focus', () => {
    const removeAllRanges = fakeSelection();
    render(<Harness />);
    fireEvent.blur(window);
    expect(removeAllRanges).toHaveBeenCalled();
  });

  it('drops the highlight on Escape instead of letting it close a dialog', () => {
    const removeAllRanges = fakeSelection();
    render(<Harness />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    const stopPropagation = jest.spyOn(event, 'stopPropagation');
    window.dispatchEvent(event);
    expect(removeAllRanges).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('lets Escape through when nothing is highlighted', () => {
    const removeAllRanges = fakeSelection({ isCollapsed: true });
    render(<Harness />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    const stopPropagation = jest.spyOn(event, 'stopPropagation');
    window.dispatchEvent(event);
    expect(removeAllRanges).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});
