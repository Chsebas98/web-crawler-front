import { useCallback, useEffect, useState } from 'react';
import { getStories, StoriesApiError } from '../api/storiesApi';
import type { Story, StoryFilter } from '../types/story';

/** Sensible default shown when the page first loads. */
export const DEFAULT_STORY_FILTER: StoryFilter = 'MORE_THAN_FIVE_WORDS';

const FALLBACK_ERROR_MESSAGE = 'Unable to load Hacker News stories. Please try again.';

type Status =
  | { key: string; kind: 'success'; stories: Story[] }
  | { key: string; kind: 'error'; message: string };

export type UseStoriesResult = {
  filter: StoryFilter;
  setFilter: (filter: StoryFilter) => void;
  stories: Story[];
  loading: boolean;
  error: string | null;
  retry: () => void;
};

/**
 * Encapsulates the request lifecycle for the stories list: fetches on mount
 * and whenever the filter changes, exposes loading/error state, and guards
 * against race conditions by keying each result to the request that produced
 * it — a slower, superseded request can never overwrite a newer one, whether
 * because it was aborted or simply because it resolves after the fact.
 */
export function useStories(initialFilter: StoryFilter = DEFAULT_STORY_FILTER): UseStoriesResult {
  const [filter, setFilter] = useState<StoryFilter>(initialFilter);
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState<Status | null>(null);

  const requestKey = `${filter}#${retryCount}`;

  useEffect(() => {
    const controller = new AbortController();

    getStories(filter, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setStatus({ key: requestKey, kind: 'success', stories: result });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setStatus({
          key: requestKey,
          kind: 'error',
          message: err instanceof StoriesApiError ? err.message : FALLBACK_ERROR_MESSAGE,
        });
      });

    return () => controller.abort();
  }, [filter, requestKey]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  const loading = status === null || status.key !== requestKey;
  const stories = status?.kind === 'success' && status.key === requestKey ? status.stories : [];
  const error = status?.kind === 'error' && status.key === requestKey ? status.message : null;

  return { filter, setFilter, stories, loading, error, retry };
}
