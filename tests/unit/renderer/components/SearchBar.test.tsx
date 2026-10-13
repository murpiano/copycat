/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../../../../src/renderer/components/SearchBar';

describe('SearchBar', () => {
  it('calls onChange with the typed value', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search clipboard history...'), {
      target: { value: 'docker' },
    });
    expect(onChange).toHaveBeenCalledWith('docker');
  });
});
