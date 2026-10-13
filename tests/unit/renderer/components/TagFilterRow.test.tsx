/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilterRow } from '../../../../src/renderer/components/TagFilterRow';

describe('TagFilterRow', () => {
  it('renders tag chips with counts and reports toggles', () => {
    const onToggle = jest.fn();
    render(
      <TagFilterRow
        tags={[{ name: 'docker', count: 142 }, { name: 'python', count: 142 }]}
        activeTags={['docker']}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByText('docker')).toBeInTheDocument();
    expect(screen.getAllByText('142')).toHaveLength(2);
    fireEvent.click(screen.getByText('python'));
    expect(onToggle).toHaveBeenCalledWith('python');
  });
});
