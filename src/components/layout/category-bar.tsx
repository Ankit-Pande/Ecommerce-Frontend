"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { catalogHref } from "@/lib/format";
import type { Category } from "@/lib/types";

// Category strip under the header on tablet and desktop.
export function CategoryBar({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLElement>(close);
  const pathname = usePathname();

  useEffect(close, [pathname, close]);

  return (
    <nav
      ref={ref}
      aria-label="Product categories"
      className="relative z-30 hidden border-b border-line bg-white md:block"
    >
      <div className="mx-auto max-w-7xl overflow-x-auto px-5 py-2 scrollbar-thin lg:px-8">
        <div className="mx-auto flex w-max items-start gap-1.5">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl py-1 text-center text-[11px] font-bold leading-tight hover:bg-ground"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-white">
              <LayoutGrid className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-0.5">
              All categories
              <ChevronDown className="h-3 w-3" />
            </span>
          </button>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={catalogHref(category)}
              className="group flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl py-1 text-center text-[11px] font-semibold leading-tight text-gray-600 transition hover:bg-ground hover:text-accent"
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white transition group-hover:ring-accent bg-ground">
                <SafeImage
                  src={category.image}
                  alt=""
                  sizes="48px"
                  className="rounded-full object-cover"
                />
              </span>
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-t border-line bg-white shadow-2xl">
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
                        className="text-xs font-medium text-gray-500 hover:text-accent"
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
