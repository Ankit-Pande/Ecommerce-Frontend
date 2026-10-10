import { Suspense } from "react";
import type { Metadata } from "next";
import { getHomeOnServer } from "@/api/catalog";
import { ProductListing } from "@/features/shop/product-listing";
import { GridSkeleton } from "@/components/ui/skeletons";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all products with price, rating and sort filters.",
};

// Product list with search and filters; categories give the page its title.
export default async function ProductsPage() {
  const home = await getHomeOnServer();
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ProductListing categories={home?.categories ?? []} />
    </Suspense>
  );
}
