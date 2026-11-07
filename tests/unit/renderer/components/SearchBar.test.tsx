/**
 * @jest-environment jsdom
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../../../../src/renderer/components/SearchBar';
import { useClipboardStore } from '../../../../src/renderer/store/useClipboardStore';

describe('SearchBar', () => {
  // These tests check the Russian-localized placeholder/labels explicitly;
  // pin the store to 'ru' so they stay independent of the app's default.
  let previousSettings: ReturnType<typeof useClipboardStore.getState>['settings'];
  beforeEach(() => {
    previousSettings = useClipboardStore.getState().settings;
    useClipboardStore.setState({ settings: { language: 'ru', hotkey: 'CommandOrControl+F1', categoriesExpanded: true, filesExpanded: true, navOrder: ['history', 'starred', 'text', 'files', 'categories'], windowBounds: null } });
  });
  afterEach(() => {
    act(() => { useClipboardStore.setState({ settings: previousSettings }); });
  });

  it('replaces the magnifier with an accessible clear button', () => {
    const onChange = jest.fn();
    render(<SearchBar value="report" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));
    expect(onChange).toHaveBeenCalledWith('');
  });
  it('calls onChange with the typed value', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Поиск по буферу обмена...'), {
      target: { value: 'docker' },
    });
    expect(onChange).toHaveBeenCalledWith('docker');
  });

  it('focuses initially and preserves another active field when raised', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Поиск по буферу обмена...');
    expect(input).toHaveFocus();

    // Move focus away the way another control would, then raise the window.
    const elsewhere = document.createElement('input');
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    expect(input).not.toHaveFocus();

    fireEvent.focus(window);
    expect(elsewhere).toHaveFocus();
    elsewhere.remove();
  });
});
