/** role="status" gives this an implicit polite live region, so screen readers announce it without extra markup. */
export function LoadingState() {
  return (
    <p className="status-message" role="status">
      Loading stories…
    </p>
  );
}
