"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { catalogHref } from "@/lib/format";
import { uiText } from "@/lib/ui-text";
import { useUiSettings } from "@/store/ui-settings-store";
import type { Category } from "@/lib/types";

// Category strip under the header on tablet and desktop.
export function CategoryBar({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLElement>(close);
  const pathname = usePathname();
  const language = useUiSettings((state) => state.language);

  useEffect(close, [pathname, close]);

  return (
    <nav
      ref={ref}
      aria-label="Product categories"
      className="relative z-30 hidden border-b border-sand bg-white dark:border-white/10 dark:bg-night md:block"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-1 overflow-x-auto px-5 py-1.5 scrollbar-thin lg:px-8">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl py-1 text-center text-[11px] font-bold leading-tight hover:bg-mist dark:hover:bg-white/10"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-chrome text-white dark:bg-accent">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span className="flex items-center gap-0.5">
            {uiText(language, "allCategories")}
            <ChevronDown className="h-3 w-3" />
          </span>
        </button>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={catalogHref(category)}
            className="flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl py-1 text-center text-[11px] font-semibold leading-tight text-gray-600 transition hover:bg-mist hover:text-accent dark:text-gray-300 dark:hover:bg-white/10"
          >
            <span className="relative h-9 w-9 overflow-hidden rounded-full bg-mist ring-1 ring-black/5 dark:bg-white/10">
              <SafeImage
                src={category.image}
                alt=""
                sizes="36px"
                className="rounded-full object-cover"
              />
            </span>
            {category.name}
          </Link>
        ))}
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t border-sand bg-white shadow-2xl dark:border-white/10 dark:bg-chrome">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-7 px-8 py-7 lg:grid-cols-6">
            {categories.map((category) => (
              <div key={category.id}>
                <Link
                  href={catalogHref(category)}
                  className="text-sm font-extrabold hover:text-accent"
                >
                  {category.name}
                </Link>
                <ul className="mt-3 space-y-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={catalogHref(child, "subcategory")}
                        className="text-xs font-medium text-gray-500 hover:text-accent dark:text-gray-400"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
