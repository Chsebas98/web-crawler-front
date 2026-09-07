import { useStories } from '../hooks/useStories';
import { FilterSelector } from '../components/FilterSelector';
import { StoryTable } from '../components/StoryTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export function HackerNewsPage() {
  const { filter, setFilter, stories, loading, error, retry } = useStories();

  return (
    <main className="page">
      <h1>Hacker News Crawler</h1>
      <p className="page-description">
        Pick a filter to see the first 30 Hacker News stories that match it. The backend applies
        the word counting, filtering and ordering — this page only displays the result.
      </p>

      <FilterSelector selected={filter} onChange={setFilter} disabled={loading} />

      <section className="results" aria-busy={loading}>
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && stories.length === 0 && <EmptyState />}
        {!loading && !error && stories.length > 0 && <StoryTable stories={stories} />}
      </section>
    </main>
  );
}
