"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";

// Which category and subcategory the current /products page shows.
export function useActiveCategory(categories: Category[]) {
  const pathname = usePathname();
  const params = useSearchParams();
  const categorySlug = params.get("category");
  const subcategorySlug = params.get("subcategory");

  if (pathname === "/products") {
    for (const category of categories) {
      const child =
        category.children.find((item) => item.slug === subcategorySlug) ??
        category.children.find((item) => item.slug === categorySlug);
      if (child)
        return { categorySlug: category.slug, subcategorySlug: child.slug };
      if (category.slug === categorySlug)
        return { categorySlug, subcategorySlug: null };
    }
  }
  return { categorySlug: null, subcategorySlug: null };
}
