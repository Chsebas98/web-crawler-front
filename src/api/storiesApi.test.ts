import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStories, StoriesApiError } from './storiesApi';
import type { Story } from '../types/story';

const sampleStories: Story[] = [
  { number: 1, title: 'Example Hacker News story', points: 123, comments: 45 },
];

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getStories', () => {
  it('requests the correct query parameter for MORE_THAN_FIVE_WORDS', async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve(sampleStories) });

    await getStories('MORE_THAN_FIVE_WORDS');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/stories?filter=MORE_THAN_FIVE_WORDS'),
      expect.anything(),
    );
  });

  it('requests the correct query parameter for FIVE_OR_FEWER_WORDS', async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve(sampleStories) });

    await getStories('FIVE_OR_FEWER_WORDS');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/stories?filter=FIVE_OR_FEWER_WORDS'),
      expect.anything(),
    );
  });

  it('resolves with the stories returned by the backend', async () => {
    mockFetchOnce({ ok: true, json: () => Promise.resolve(sampleStories) });

    const result = await getStories('MORE_THAN_FIVE_WORDS');

    expect(result).toEqual(sampleStories);
  });

  it('uses the backend message when the error response is structured', async () => {
    mockFetchOnce({
      ok: false,
      status: 502,
      json: () =>
        Promise.resolve({
          response: false,
          statusCode: 502,
          message: 'Unable to retrieve Hacker News entries',
          errorDetail: 'CRAWLING_ERROR',
        }),
    });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Unable to retrieve Hacker News entries',
      statusCode: 502,
      errorDetail: 'CRAWLING_ERROR',
    });
  });

  it('falls back to a friendly message when the error body is not usable', async () => {
    mockFetchOnce({ ok: false, status: 500, json: () => Promise.reject(new Error('not json')) });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toBeInstanceOf(StoriesApiError);
    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Unable to load Hacker News stories. Please try again.',
    });
  });

  it('rejects with a friendly message when the response shape is unexpected', async () => {
    mockFetchOnce({ ok: true, json: () => Promise.resolve({ not: 'an array' }) });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Unable to load Hacker News stories. Please try again.',
    });
  });
});
