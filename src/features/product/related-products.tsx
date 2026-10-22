"use client";

import { useEffect, useState } from "react";
import { getRelatedProducts } from "@/api/catalog";
import { ProductCard } from "@/components/product/product-card";
import { RowSkeleton } from "@/components/ui/skeletons";
import { useInViewOnce } from "@/hooks/use-in-view";
import type { Product } from "@/lib/types";

// "Related products" row, loaded when scrolled near.
export function RelatedProducts({ slug }: { slug: string }) {
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!inView) return;
    let active = true;
    getRelatedProducts(slug)
      .catch(() => [])
      .then((related) => {
        if (active) setProducts(related);
      });
    return () => {
      active = false;
    };
  }, [slug, inView]);

  if (products?.length === 0) return null;

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <h2 className="section-title">Related products</h2>
      {products ? (
        <div className="scroll-row">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <RowSkeleton />
      )}
    </section>
  );
}
