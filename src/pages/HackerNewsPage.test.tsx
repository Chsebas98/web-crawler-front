import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HackerNewsPage } from './HackerNewsPage';
import { getStories, StoriesApiError } from '../api/storiesApi';
import type { Story } from '../types/story';

vi.mock('../api/storiesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/storiesApi')>();
  return { ...actual, getStories: vi.fn() };
});

const mockedGetStories = vi.mocked(getStories);

const stories: Story[] = [
  { number: 1, title: 'Example Hacker News story', points: 123, comments: 45 },
  { number: 2, title: 'Another story here', points: 98, comments: 32 },
];

beforeEach(() => {
  mockedGetStories.mockReset();
});

describe('HackerNewsPage', () => {
  it('shows the loading state while the initial request is pending', () => {
    mockedGetStories.mockReturnValue(new Promise(() => {}));

    render(<HackerNewsPage />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  it('renders both filter options, each triggering the matching request', async () => {
    const user = userEvent.setup();
    mockedGetStories.mockResolvedValue(stories);

    render(<HackerNewsPage />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const moreThanFive = screen.getByRole('radio', { name: /more than 5 words/i });
    const fiveOrFewer = screen.getByRole('radio', { name: /5 words or fewer/i });
    expect(moreThanFive).toBeChecked();
    expect(fiveOrFewer).not.toBeChecked();
    expect(mockedGetStories).toHaveBeenLastCalledWith('MORE_THAN_FIVE_WORDS', expect.anything());

    await user.click(fiveOrFewer);

    await waitFor(() =>
      expect(mockedGetStories).toHaveBeenLastCalledWith('FIVE_OR_FEWER_WORDS', expect.anything()),
    );
    expect(fiveOrFewer).toBeChecked();
  });

  it('renders story number, title, points and comments for each result', async () => {
    mockedGetStories.mockResolvedValue(stories);

    render(<HackerNewsPage />);

    const row = await screen.findByRole('row', { name: /example hacker news story/i });
    expect(within(row).getByText('1')).toBeInTheDocument();
    expect(within(row).getByText('Example Hacker News story')).toBeInTheDocument();
    expect(within(row).getByText('123')).toBeInTheDocument();
    expect(within(row).getByText('45')).toBeInTheDocument();
  });

  it('shows a friendly message on failure and recovers via Retry', async () => {
    const user = userEvent.setup();
    mockedGetStories.mockRejectedValueOnce(
      new StoriesApiError('Unable to retrieve Hacker News entries'),
    );

    render(<HackerNewsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to retrieve Hacker News entries',
    );

    mockedGetStories.mockResolvedValueOnce(stories);
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('row', { name: /example hacker news story/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the empty state when the backend returns no matches', async () => {
    mockedGetStories.mockResolvedValue([]);

    render(<HackerNewsPage />);

    expect(await screen.findByText('No stories match this filter.')).toBeInTheDocument();
  });
});
