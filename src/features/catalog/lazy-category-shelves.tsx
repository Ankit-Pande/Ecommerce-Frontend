"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getCatalog } from "@/api/catalog";
import { SectionHeader } from "@/components/ui/section-header";
import { CardSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import { catalogHref } from "@/lib/format";
import { ProductCard } from "./product-card";
import { ProductScroller } from "./product-scroller";
import type { Category, Product } from "@/lib/types";

const PRODUCTS_PER_SHELF = 10;
const MAX_CHIPS = 6;

// One shelf per category with subcategory chips; each loads only when scrolled near.
export function LazyCategoryShelves({
  categories,
}: {
  categories: Category[];
}) {
  return categories.map((category) => (
    <CategoryShelf key={category.id} category={category} />
  ));
}

// Loads its products only when scrolled near.
function CategoryShelf({ category }: { category: Category }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let active = true;
    setFailed(false);

    const params = new URLSearchParams({
      category: category.slug,
      limit: String(PRODUCTS_PER_SHELF),
    });
    getCatalog(params)
      .then((response) => {
        if (active) setProducts(response.items);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [category.slug, reloadKey, inView]);

  if (products?.length === 0) return null;

  return (
    <section ref={ref}>
      <SectionHeader
        title={`Best of ${category.name}`}
        href={catalogHref(category)}
      />
      {category.children.length > 0 && (
        <div className="-mt-1 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {category.children.slice(0, MAX_CHIPS).map((child) => (
            <Link
              key={child.id}
              href={catalogHref(child, "subcategory")}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80 bg-mist dark:bg-white/[0.06]"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {failed && (
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="mb-3 flex w-full items-center justify-between rounded-xl bg-gold/10 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
        >
          Could not load products.
          <span className="flex items-center gap-1.5 font-extrabold text-accent">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </span>
        </button>
      )}

      <ProductScroller label={category.name}>
        {products
          ? products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          : Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
      </ProductScroller>
    </section>
  );
}
