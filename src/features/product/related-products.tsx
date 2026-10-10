"use client";

import { useEffect, useState } from "react";
import { getRelatedProducts } from "@/api/catalog";
import { useInViewOnce } from "@/hooks/use-in-view";
import { GridSkeleton } from "@/components/ui/skeletons";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/types";

// Similar products shown on the product page.
export function RelatedProducts({ slug }: { slug: string }) {
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
    <section ref={ref} className="flex flex-col gap-3">
      <h2 className="text-[26px] font-extrabold">Related products</h2>
      {products ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : failed ? (
        <p className="card flex flex-wrap items-center justify-between gap-3 p-4 font-semibold">
          Could not load related products.
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="btn-grey"
          >
            Retry
          </button>
        </p>
      ) : (
        <GridSkeleton count={4} />
      )}
    </section>
  );
}
