"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GridSkeleton } from "@/components/ui/skeletons";

// Shown when the home API does not answer.
export function HomeRetry() {
  const router = useRouter();
  const [checking, startChecking] = useTransition();

  return (
    <div className="flex flex-col gap-7">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="font-semibold">Could not load the store.</p>
        <button
          type="button"
          onClick={() => startChecking(() => router.refresh())}
          disabled={checking}
          className="btn-primary"
        >
          {checking ? "Checking…" : "Try again"}
        </button>
      </div>
      <GridSkeleton />
    </div>
  );
}
