/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { App } from '../../../src/renderer/App';
import type { CopycatAPI } from '../../../src/shared/types';

beforeEach(() => {
  const api: CopycatAPI = {
    getItems: jest.fn().mockResolvedValue([]),
    copyItem: jest.fn(),
    pasteItem: jest.fn(),
    toggleStar: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    deleteItem: jest.fn(),
    onItemAdded: jest.fn().mockReturnValue(() => {}),
  } as unknown as CopycatAPI;
  (window as unknown as { copycat: CopycatAPI }).copycat = api;
});

describe('App', () => {
  it('renders the search bar and tab bar', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search clipboard history...')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Starred')).toBeInTheDocument();
  });
});
