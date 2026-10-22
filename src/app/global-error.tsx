"use client";

import "./globals.css";

// Shown when even the root layout crashes.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center p-6">
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <h1 className="page-title">Something went wrong</h1>
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
