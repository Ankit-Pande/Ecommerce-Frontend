"use client";

import { useEffect, useState } from "react";
import { getProductsBySlugs } from "@/api/catalog";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "@/features/catalog/product-card";
import { ProductScroller } from "@/features/catalog/product-scroller";
import type { Product } from "@/lib/types";

const STORAGE_KEY = "apnakart-recent-slugs";
const MAX_PRODUCTS = 8;

/** Saves the opened product's slug on this device. Private browsing may block it, so failure is ignored. */
export function RecentProductTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const saved = readSlugs().filter((item) => item !== slug);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([slug, ...saved].slice(0, MAX_PRODUCTS)),
      );
    } catch {
      return;
    }
  }, [slug]);

  return null;
}

// Only slugs are saved, so price and stock always come fresh from the backend.
export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const slugs = readSlugs();
    if (slugs.length === 0) return;

    let active = true;
    getProductsBySlugs(slugs)
      .then((found) => {
        if (active) setProducts(found);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Recently viewed" />
      <ProductScroller label="Recently viewed products">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductScroller>
    </section>
  );
}

function readSlugs(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX_PRODUCTS)
      : [];
  } catch {
    return [];
  }
}
