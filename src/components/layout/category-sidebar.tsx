"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SafeImage } from "@/components/ui/safe-image";
import { useActiveCategory } from "@/hooks/use-active-category";
import { tintAt } from "@/lib/colors";
import { categoryHref, subcategoryHref } from "@/lib/links";
import { useUiStore } from "@/store/ui-store";
import type { Category } from "@/lib/types";

type Current = { categorySlug: string | null; subcategorySlug: string | null };

// Category list: inline on wide /products pages, a drawer everywhere else.
export function CategorySidebar({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <Suspense
      fallback={
        <Sidebar
          categories={categories}
          current={{ categorySlug: null, subcategorySlug: null }}
        />
      }
    >
      <ActiveSidebar categories={categories} />
    </Suspense>
  );
}

// The sidebar with the current category open (reads the URL, so it sits inside Suspense).
function ActiveSidebar({ categories }: { categories: Category[] }) {
  const current = useActiveCategory(categories);
  return <Sidebar categories={categories} current={current} />;
}

// Categories with their subcategories; closes on page change and on Escape.
function Sidebar({
  categories,
  current,
}: {
  categories: Category[];
  current: Current;
}) {
  const pathname = usePathname();
  const menuOpen = useUiStore((state) => state.menuOpen);
  const sideHidden = useUiStore((state) => state.sideHidden);
  const setMenuOpen = useUiStore((state) => state.setMenuOpen);
  const setSideHidden = useUiStore((state) => state.setSideHidden);
  const [openId, setOpenId] = useState<string | null>(null);

  const inline = pathname === "/products" && !sideHidden;
  const activeId =
    categories.find((category) => category.slug === current.categorySlug)?.id ??
    "";
  const expandedId = openId ?? activeId;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    // Closes the drawer when Escape is pressed.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, setMenuOpen]);

  // Closes the drawer, or hides the inline sidebar.
  function hide() {
    if (menuOpen) setMenuOpen(false);
    else setSideHidden(true);
  }

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="Close categories"
          onClick={() => setMenuOpen(false)}
          className={`fixed inset-0 z-40 bg-ink/50 ${inline ? "xl:hidden" : ""}`}
        />
      )}
      <aside
        aria-label="Categories and subcategories"
        className={`flex-col gap-1 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,42,46,.12)] ${menuOpen ? "fixed inset-y-0 left-0 z-50 flex w-[min(300px,82%)] overflow-y-auto rounded-r-3xl" : "hidden"} ${inline ? "xl:static xl:z-auto xl:flex xl:w-auto xl:max-w-[320px] xl:flex-[1_1_260px] xl:overflow-visible xl:rounded-[20px]" : ""}`}
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-ground px-1 pb-2.5">
          <span className="text-xl font-extrabold">Categories</span>
          <button
            type="button"
            onClick={hide}
            className="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white"
          >
            Hide ✕
          </button>
        </div>

        {categories.map((category, index) => {
          const active = category.slug === current.categorySlug;
          const expanded = category.id === expandedId;
          return (
            <div key={category.id}>
              <div className="flex items-center gap-1.5">
                <Link
                  href={categoryHref(category.slug)}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-12 flex-1 items-center gap-2.5 rounded-[14px] py-1 pl-1 pr-2 font-extrabold ${active ? "bg-ground text-accent" : ""}`}
                >
                  <span
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: tintAt(index) }}
                  >
                    <SafeImage
                      src={category.image}
                      alt=""
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </span>
                  {category.name}
                </Link>
                {category.children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? "" : category.id)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Hide" : "Show"} ${category.name} subcategories`}
                    className="h-11 w-11 shrink-0 rounded-xl border border-line bg-white text-xl font-semibold"
                  >
                    {expanded ? "−" : "+"}
                  </button>
                )}
              </div>
              {expanded && (
                <div className="mb-2 ml-6 mt-1 flex flex-col gap-0.5 border-l-2 border-line pl-3.5">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={subcategoryHref(child.slug)}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-11 items-center rounded-[10px] px-3 ${child.slug === current.subcategorySlug ? "bg-ground font-extrabold text-accent" : ""}`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>
    </>
  );
}
