import type { Story, StoryFilter } from '../types/story';

const FALLBACK_ERROR_MESSAGE = 'Unable to load Hacker News stories. Please try again.';

/**
 * Every response from this backend — success or error, including 404/405 on
 * routes that don't exist — has exactly this envelope, with `statusCode`
 * mirroring the actual HTTP status. `response` (not `res.ok`) is what tells
 * success from error; `errorDetail` is a safe, generic, user-facing
 * description of the error (never the raw exception message).
 */
type ApiResponse<T> = {
  response: boolean;
  statusCode: number;
  message: string;
  result: T | null;
  errorDetail: string | null;
};

/** Error thrown by the stories API with a message that is always safe to show the user. */
export class StoriesApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'StoriesApiError';
    this.statusCode = statusCode;
  }
}

function isApiResponseEnvelope(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.response === 'boolean' && typeof candidate.message === 'string';
}

function isStory(value: unknown): value is Story {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.number === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.points === 'number' &&
    typeof candidate.comments === 'number'
  );
}

/**
 * Fetches the first 30 Hacker News stories for the given filter.
 * The backend always answers with the same envelope regardless of HTTP
 * status, so the body — not `res.ok` — decides success or error here.
 */
export async function getStories(filter: StoryFilter, signal?: AbortSignal): Promise<Story[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}/api/stories?filter=${filter}`;

  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new StoriesApiError(FALLBACK_ERROR_MESSAGE);
  }

  const rawBody: unknown = await res.json().catch(() => null);
  const body = isApiResponseEnvelope(rawBody) ? rawBody : null;

  if (!body || !body.response) {
    // errorDetail is the safe, user-facing description; message is a short
    // title-like fallback if it's missing for some reason.
    const displayMessage = body?.errorDetail ?? body?.message ?? FALLBACK_ERROR_MESSAGE;
    throw new StoriesApiError(displayMessage, body?.statusCode ?? res.status);
  }

  const stories = body.result;
  if (!Array.isArray(stories) || !stories.every(isStory)) {
    throw new StoriesApiError(FALLBACK_ERROR_MESSAGE);
  }

  return stories;
}
