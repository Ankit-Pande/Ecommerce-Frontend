"use client";

// Shown when the store could not be reached, with a retry button.
export function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <h2 className="section-title">Could not reach the store</h2>
      <p className="text-muted">Check your connection and try again.</p>
      <button type="button" onClick={onRetry} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
