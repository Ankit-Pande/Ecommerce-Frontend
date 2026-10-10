"use client";

import { Children, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontal product row with arrow buttons.
export function ProductScroller({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scrolls the row left or right.
  function move(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction * list.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  return (
    <div className="group/shelf relative">
      <div
        ref={listRef}
        aria-label={label}
        className="grid snap-x snap-mandatory grid-flow-col auto-cols-[46%] gap-3 overflow-x-auto pb-2 scrollbar-thin sm:auto-cols-[31%] sm:gap-4 md:auto-cols-[23%] lg:auto-cols-[19%] xl:auto-cols-[calc((100%-5rem)/6)]"
      >
        {Children.map(children, (child) => (
          <div className="min-w-0 snap-start">{child}</div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label={`Move ${label} left`}
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white text-ink opacity-0 shadow-lg transition hover:bg-ground group-hover/shelf:opacity-100 focus-visible:opacity-100 sm:grid"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label={`Move ${label} right`}
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white text-ink opacity-0 shadow-lg transition hover:bg-ground group-hover/shelf:opacity-100 focus-visible:opacity-100 sm:grid"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
