type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

/** role="alert" announces the message immediately; the message is always the safe, user-friendly one. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="status-message status-message--error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
