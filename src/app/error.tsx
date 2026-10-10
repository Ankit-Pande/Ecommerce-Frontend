"use client";

import { useEffect } from "react";

// Shown when a page crashes.
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
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center">
      <h1 className="text-[32px] font-extrabold">Something went wrong</h1>
      <button
        type="button"
        onClick={reset}
        className="btn-primary min-h-12 px-7"
      >
        Try again
      </button>
    </div>
  );
}
