/**
 * A single Hacker News story as returned by the backend.
 * The backend is the source of truth for word counting, filtering and sorting;
 * this shape is only used to render the result.
 */
export type Story = {
  number: number;
  title: string;
  points: number;
  comments: number;
};

/**
 * Supported filters for GET /api/stories?filter=...
 *
 * - MORE_THAN_FIVE_WORDS: title has more than 5 words, ordered by comments desc.
 * - FIVE_OR_FEWER_WORDS: title has 5 words or fewer, ordered by points desc.
 */
export type StoryFilter = 'MORE_THAN_FIVE_WORDS' | 'FIVE_OR_FEWER_WORDS';
