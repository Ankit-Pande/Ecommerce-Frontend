"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { ProductScroller } from "./product-scroller";
import { CardSkeleton } from "@/components/ui/skeletons";

const SHELVES = ["Trending now", "Discount offers", "New arrivals"];

// Shown when the home API does not answer.
export function HomeRetry() {
  const router = useRouter();
  const [checking, startChecking] = useTransition();

  return (
    <div className="pb-12">
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-gold/10 px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
        <span>Could not load the store.</span>
        <button
          type="button"
          onClick={() => startChecking(() => router.refresh())}
          disabled={checking}
          className="inline-flex items-center gap-1.5 font-extrabold text-accent"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
          />
          {checking ? "Checking..." : "Try again"}
        </button>
      </div>

      {SHELVES.map((title) => (
        <section key={title} className="mt-9 sm:mt-12">
          <h2 className="section-title">{title}</h2>
          <div className="mt-4">
            <ProductScroller label={`${title} loading`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </ProductScroller>
          </div>
        </section>
      ))}
    </div>
  );
}
