/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../../../../src/renderer/components/SearchBar';

describe('SearchBar', () => {
  it('calls onChange with the typed value', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Поиск по буферу обмена...'), {
      target: { value: 'docker' },
    });
    expect(onChange).toHaveBeenCalledWith('docker');
  });

  it('takes focus on mount and again when the window is raised', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Поиск по буферу обмена...');
    expect(input).toHaveFocus();

    // Move focus away the way another control would, then raise the window.
    const elsewhere = document.createElement('input');
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    expect(input).not.toHaveFocus();

    fireEvent.focus(window);
    expect(input).toHaveFocus();
  });
});
