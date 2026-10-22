import { Suspense } from "react";
import type { Metadata } from "next";
import {
  catalogParams,
  getCatalogOnServer,
  getHomeOnServer,
} from "@/api/catalog";
import { GridSkeleton } from "@/components/ui/skeletons";
import { ProductListing } from "@/features/shop/product-listing";
import { categoryHref, subcategoryHref } from "@/lib/links";

type SearchParams = Record<string, string | string[] | undefined>;
type ProductsPageProps = { searchParams: Promise<SearchParams> };

// The page's search params as URLSearchParams (single values only).
function pageParams(searchParams: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

// Title and canonical link per category; search result pages are not indexed.
export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const page = pageParams(await searchParams);
  const search = (page.get("q") ?? "").trim();
  if (search) {
    return {
      title: `Results for "${search.slice(0, 60)}"`,
      robots: { index: false },
    };
  }

  const home = await getHomeOnServer();
  const categories = home?.categories ?? [];
  const categorySlug = page.get("category");
  const subcategorySlug = page.get("subcategory");
  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = categories
    .flatMap((item) => item.children)
    .find((item) => item.slug === subcategorySlug);
  const shown = subcategory ?? category;
  if (!shown) return { title: "Products" };

  return {
    title: shown.name,
    description: `${shown.name} at ApnaKart: prices, offers and ratings. Pay by UPI, card or Cash on Delivery.`,
    alternates: {
      canonical: subcategory
        ? subcategoryHref(subcategory.slug)
        : categoryHref(shown.slug),
    },
  };
}

// Product list; category pages get their first page from the server (SEO), search results load in the browser.
export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const page = pageParams(await searchParams);
  const [home, firstPage] = await Promise.all([
    getHomeOnServer(),
    page.has("q") ? null : getCatalogOnServer(catalogParams(page)),
  ]);

  return (
    <Suspense fallback={<GridSkeleton count={12} />}>
      <ProductListing
        key={page.toString()}
        categories={home?.categories ?? []}
        firstPage={firstPage}
      />
    </Suspense>
  );
}
