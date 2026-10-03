import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductListing } from "@/features/catalog/product-listing";
import { GridSkeleton } from "@/components/ui/skeletons";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse all products with filters — brand, colour, price and more.",
};

// Product list with search and filters.
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-5">
          <GridSkeleton />
        </div>
      }
    >
      <ProductListing />
    </Suspense>
  );
}
