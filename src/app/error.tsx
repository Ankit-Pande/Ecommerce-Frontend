"use client";

import { useEffect } from "react";

// Shown when a page crashes; "Try again" renders it again.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <h1 className="page-title">Something went wrong</h1>
      <button type="button" onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
