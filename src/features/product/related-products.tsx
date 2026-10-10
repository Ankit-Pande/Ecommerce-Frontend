"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getRelatedProducts } from "@/api/catalog";
import { useInViewOnce } from "@/hooks/use-in-view";
import { CardSkeleton } from "@/components/ui/skeletons";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/components/product/product-card";
import { ProductScroller } from "@/components/product/product-scroller";
import type { Product } from "@/lib/types";

const PRODUCT_LIMIT = 8;

// Similar products shown on the product page.
export function RelatedProducts({
  slug,
  categoryLink,
}: {
  slug: string;
  categoryLink: string;
}) {
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let active = true;
    setProducts(null);
    setFailed(false);

    getRelatedProducts(slug)
      .then((related) => {
        if (active) setProducts(related);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [slug, reloadKey, inView]);

  if (products?.length === 0) return null;

  return (
    <section ref={ref}>
      <SectionHeader title="Related products" href={categoryLink} />

      {products ? (
        <ProductScroller label="Related products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductScroller>
      ) : (
        <div>
          {failed && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-sunny/10 px-3 py-2 text-xs font-semibold text-gray-600">
              <span>Could not load related products.</span>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="inline-flex min-h-10 items-center gap-1.5 font-extrabold text-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}
          <ProductScroller label="Related products loading">
            {Array.from({ length: PRODUCT_LIMIT }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </ProductScroller>
        </div>
      )}
    </section>
  );
}
