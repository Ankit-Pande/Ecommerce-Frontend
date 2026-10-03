"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { getCatalog } from "@/api/catalog";
import { SectionHeader } from "@/components/ui/section-header";
import { CardSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import { catalogHref } from "@/lib/format";
import { ProductCard } from "./product-card";
import { ProductScroller } from "./product-scroller";
import type { Category, Product } from "@/lib/types";

const PRODUCTS_PER_SHELF = 10;

type Subcategory = Category["children"][number];

// One block per category with a shelf per subcategory.
export function LazyCategoryShelves({
  categories,
}: {
  categories: Category[];
}) {
  return categories
    .filter((category) => category.children.length > 0)
    .map((category) => (
      <section key={category.id}>
        <SectionHeader
          title={`Best of ${category.name}`}
          href={catalogHref(category)}
        />
        <div className="space-y-7">
          {category.children.map((child) => (
            <SubcategoryShelf key={child.id} subcategory={child} />
          ))}
        </div>
      </section>
    ));
}

// Loads its products only when scrolled near.
function SubcategoryShelf({ subcategory }: { subcategory: Subcategory }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let active = true;
    setFailed(false);

    const params = new URLSearchParams({ subcategory: subcategory.slug });
    params.set("limit", String(PRODUCTS_PER_SHELF));
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
  }, [subcategory, reloadKey, inView]);

  if (products?.length === 0) return null;

  return (
    <div ref={ref}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold">{subcategory.name}</h3>
        <Link
          href={catalogHref(subcategory, "subcategory")}
          className="flex items-center gap-1 text-xs font-extrabold text-accent"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

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

      <ProductScroller label={subcategory.name}>
        {products
          ? products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          : Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
      </ProductScroller>
    </div>
  );
}
