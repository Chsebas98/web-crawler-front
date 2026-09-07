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
    const fetchMock = mockFetchOnce({
      json: () =>
        Promise.resolve({
          response: true,
          statusCode: 200,
          message: 'Stories retrieved',
          result: sampleStories,
          errorDetail: null,
        }),
    });

    await getStories('MORE_THAN_FIVE_WORDS');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/stories?filter=MORE_THAN_FIVE_WORDS'),
      expect.anything(),
    );
  });

  it('requests the correct query parameter for FIVE_OR_FEWER_WORDS', async () => {
    const fetchMock = mockFetchOnce({
      json: () =>
        Promise.resolve({
          response: true,
          statusCode: 200,
          message: 'Stories retrieved',
          result: sampleStories,
          errorDetail: null,
        }),
    });

    await getStories('FIVE_OR_FEWER_WORDS');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/stories?filter=FIVE_OR_FEWER_WORDS'),
      expect.anything(),
    );
  });

  it('resolves with result when response is true, regardless of HTTP status', async () => {
    mockFetchOnce({
      json: () =>
        Promise.resolve({
          response: true,
          statusCode: 200,
          message: 'Stories retrieved',
          result: sampleStories,
          errorDetail: null,
        }),
    });

    const result = await getStories('MORE_THAN_FIVE_WORDS');

    expect(result).toEqual(sampleStories);
  });

  it('prefers errorDetail over message for the error text (502 example)', async () => {
    mockFetchOnce({
      ok: false,
      status: 502,
      json: () =>
        Promise.resolve({
          response: false,
          statusCode: 502,
          message: 'Information unavailable',
          result: null,
          errorDetail: 'We could not complete your request. Please try again later.',
        }),
    });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'We could not complete your request. Please try again later.',
      statusCode: 502,
    });
  });

  it('falls back to message when errorDetail is missing (defensive)', async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          response: false,
          statusCode: 500,
          message: 'Something went wrong',
          result: null,
          errorDetail: null,
        }),
    });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Something went wrong',
      statusCode: 500,
    });
  });

  it('falls back to a generic message when the body is not the expected envelope', async () => {
    mockFetchOnce({ ok: false, status: 500, json: () => Promise.reject(new Error('not json')) });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toBeInstanceOf(StoriesApiError);
    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Unable to load Hacker News stories. Please try again.',
    });
  });

  it('rejects with a friendly message when result is not a valid Story array', async () => {
    mockFetchOnce({
      json: () =>
        Promise.resolve({
          response: true,
          statusCode: 200,
          message: 'Stories retrieved',
          result: [{ not: 'a story' }],
          errorDetail: null,
        }),
    });

    await expect(getStories('MORE_THAN_FIVE_WORDS')).rejects.toMatchObject({
      message: 'Unable to load Hacker News stories. Please try again.',
    });
  });
});
