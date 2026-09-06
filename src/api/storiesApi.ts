import type { Story, StoryFilter } from '../types/story';

const FALLBACK_ERROR_MESSAGE = 'Unable to load Hacker News stories. Please try again.';

/**
 * Structured error shape the backend may return, e.g.:
 * { response: false, statusCode: 502, message: "...", result: [], errorDetail: "CRAWLING_ERROR" }
 * All fields are optional here because we don't fully trust an external response body.
 */
type BackendErrorBody = {
  message?: string;
  errorDetail?: string;
};

/** Error thrown by the stories API with a message that is always safe to show the user. */
export class StoriesApiError extends Error {
  readonly statusCode?: number;
  readonly errorDetail?: string;

  constructor(message: string, options?: { statusCode?: number; errorDetail?: string }) {
    super(message);
    this.name = 'StoriesApiError';
    this.statusCode = options?.statusCode;
    this.errorDetail = options?.errorDetail;
  }
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return typeof value === 'object' && value !== null;
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

/** Extracts a safe, user-friendly message from a non-OK response, falling back when needed. */
async function readErrorMessage(res: Response): Promise<{ message: string; errorDetail?: string }> {
  try {
    const body: unknown = await res.json();
    if (isBackendErrorBody(body) && typeof body.message === 'string' && body.message.trim()) {
      return { message: body.message, errorDetail: body.errorDetail };
    }
  } catch {
    // Response body was missing or not valid JSON — use the fallback below.
  }
  return { message: FALLBACK_ERROR_MESSAGE };
}

/**
 * Fetches the first 30 Hacker News stories for the given filter.
 * The backend owns filtering, sorting and word counting — the result is
 * returned exactly as received, in the same order.
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

  if (!res.ok) {
    const { message, errorDetail } = await readErrorMessage(res);
    throw new StoriesApiError(message, { statusCode: res.status, errorDetail });
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data) || !data.every(isStory)) {
    throw new StoriesApiError(FALLBACK_ERROR_MESSAGE);
  }

  return data;
}
