/** Shown when the backend returns zero matches — this is not an error. */
export function EmptyState() {
  return (
    <p className="status-message" role="status">
      No stories match this filter.
    </p>
  );
}
