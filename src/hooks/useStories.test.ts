import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStories } from './useStories';
import { getStories, StoriesApiError } from '../api/storiesApi';
import type { Story } from '../types/story';

vi.mock('../api/storiesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/storiesApi')>();
  return { ...actual, getStories: vi.fn() };
});

const mockedGetStories = vi.mocked(getStories);

const storiesA: Story[] = [{ number: 1, title: 'Story A', points: 10, comments: 100 }];
const storiesB: Story[] = [{ number: 2, title: 'Story B', points: 20, comments: 200 }];

beforeEach(() => {
  mockedGetStories.mockReset();
});

describe('useStories', () => {
  it('fetches the default filter on mount and reflects loading -> loaded', async () => {
    mockedGetStories.mockResolvedValue(storiesA);

    const { result } = renderHook(() => useStories());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filter).toBe('MORE_THAN_FIVE_WORDS');
    expect(result.current.stories).toEqual(storiesA);
    expect(mockedGetStories).toHaveBeenCalledWith('MORE_THAN_FIVE_WORDS', expect.anything());
  });

  it('refetches with the new filter when setFilter is called', async () => {
    mockedGetStories.mockResolvedValueOnce(storiesA).mockResolvedValueOnce(storiesB);

    const { result } = renderHook(() => useStories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setFilter('FIVE_OR_FEWER_WORDS'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filter).toBe('FIVE_OR_FEWER_WORDS');
    expect(result.current.stories).toEqual(storiesB);
    expect(mockedGetStories).toHaveBeenLastCalledWith('FIVE_OR_FEWER_WORDS', expect.anything());
  });

  it('never lets an earlier, slower request overwrite a later one', async () => {
    let resolveFirst: (value: Story[]) => void;
    const firstRequest = new Promise<Story[]>((resolve) => {
      resolveFirst = resolve;
    });

    mockedGetStories.mockImplementationOnce(() => firstRequest);
    mockedGetStories.mockResolvedValueOnce(storiesB);

    const { result } = renderHook(() => useStories());

    // Switch filters before the first (slow) request resolves.
    act(() => result.current.setFilter('FIVE_OR_FEWER_WORDS'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stories).toEqual(storiesB);

    // The slow first request finally resolves — it must be ignored.
    await act(async () => resolveFirst(storiesA));

    expect(result.current.stories).toEqual(storiesB);
    expect(result.current.filter).toBe('FIVE_OR_FEWER_WORDS');
  });

  it('exposes a friendly error message and clears stories on failure', async () => {
    mockedGetStories.mockRejectedValue(
      new StoriesApiError('Unable to retrieve Hacker News entries'),
    );

    const { result } = renderHook(() => useStories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Unable to retrieve Hacker News entries');
    expect(result.current.stories).toEqual([]);
  });

  it('falls back to a generic message for unexpected errors', async () => {
    mockedGetStories.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useStories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Unable to load Hacker News stories. Please try again.');
  });

  it('retries the current filter and clears the previous error on success', async () => {
    mockedGetStories.mockRejectedValueOnce(new StoriesApiError('failed once'));
    mockedGetStories.mockResolvedValueOnce(storiesA);

    const { result } = renderHook(() => useStories());
    await waitFor(() => expect(result.current.error).toBe('failed once'));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.stories).toEqual(storiesA);
    expect(mockedGetStories).toHaveBeenCalledTimes(2);
  });

  it('resolves to an empty list when the backend returns no matches', async () => {
    mockedGetStories.mockResolvedValue([]);

    const { result } = renderHook(() => useStories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stories).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
