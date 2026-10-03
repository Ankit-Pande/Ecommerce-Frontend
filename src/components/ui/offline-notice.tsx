"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error box with a retry button when the API does not answer.
export function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card mx-auto mt-8 max-w-lg p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-deal/10 text-deal">
        <WifiOff className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold">
        Could not reach the store
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">
        Check your connection and try again.
      </p>
      <Button onClick={onRetry} className="mt-5">
        <RefreshCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
