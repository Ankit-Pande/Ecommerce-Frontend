"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { getCatalog, getCatalogFilters } from "@/api/catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { GridSkeleton } from "@/components/ui/skeletons";
import { ProductCard } from "@/features/catalog/product-card";
import {
  MobileProductFilters,
  ProductFilters,
} from "@/features/catalog/product-filters";
import type { Category, Product, ProductFacets } from "@/lib/types";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;
const MIN_SEARCH_LENGTH = 2;

const SORT_OPTIONS = [
  { value: "latest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "rating", label: "Top rated" },
] as const;

type Sort = (typeof SORT_OPTIONS)[number]["value"];

// Product list page with search, filters, sort and load more.
export function ProductListing({ categories }: { categories: Category[] }) {
  const urlParams = useSearchParams();
  const query = urlParams.get("q")?.trim() ?? "";
  const searchText = query.length >= MIN_SEARCH_LENGTH ? query : "";
  const category = urlParams.get("category") ?? "";
  const subcategory = urlParams.get("subcategory") ?? "";
  const section = urlParams.get("section") ?? "";
  const requestedDiscount = urlParams.get("discount") === "true";
  const requestedBrand = urlParams.get("brand") ?? "";
  const requestedColor = urlParams.get("color") ?? "";
  const requestedMinPrice = readPrice(urlParams.get("minPrice"));
  const requestedMaxPrice = readPrice(urlParams.get("maxPrice"));
  const requestedSort = urlParams.get("sort");

  const [brand, setBrand] = useState(requestedBrand);
  const [color, setColor] = useState(requestedColor);
  const [discountOnly, setDiscountOnly] = useState(requestedDiscount);
  const [minPrice, setMinPrice] = useState(requestedMinPrice);
  const [maxPrice, setMaxPrice] = useState(requestedMaxPrice);
  const [sort, setSort] = useState<Sort>(() => readSort(requestedSort));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [facets, setFacets] = useState<ProductFacets>({
    brands: [],
    colors: [],
  });

  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);

  useEffect(() => {
    setBrand(requestedBrand);
    setColor(requestedColor);
    setDiscountOnly(requestedDiscount);
    setMinPrice(requestedMinPrice);
    setMaxPrice(requestedMaxPrice);
  }, [
    category,
    subcategory,
    query,
    requestedBrand,
    requestedColor,
    requestedDiscount,
    requestedMaxPrice,
    requestedMinPrice,
  ]);

  useEffect(() => {
    setSort(readSort(requestedSort));
  }, [requestedSort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);

    let active = true;
    getCatalogFilters(params)
      .then((found) => {
        if (active) setFacets(found);
      })
      .catch(() => {
        if (active) setFacets({ brands: [], colors: [] });
      });

    return () => {
      active = false;
    };
  }, [category, subcategory]);

  const loadProducts = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (searchText) params.set("q", searchText);
      if (category) params.set("category", category);
      if (subcategory) params.set("subcategory", subcategory);
      if (section) params.set("section", section);
      if (discountOnly) params.set("discount", "true");
      if (brand) params.set("brand", brand);
      if (color) params.set("color", color);
      const priceRangeValid =
        !debouncedMinPrice ||
        !debouncedMaxPrice ||
        Number(debouncedMinPrice) <= Number(debouncedMaxPrice);
      if (debouncedMinPrice && priceRangeValid)
        params.set("minPricePaise", rupeesToPaise(debouncedMinPrice));
      if (debouncedMaxPrice && priceRangeValid)
        params.set("maxPricePaise", rupeesToPaise(debouncedMaxPrice));
      if (cursor) params.set("cursor", cursor);
      params.set("sort", sort);
      params.set("limit", String(PAGE_SIZE));
      return getCatalog(params);
    },
    [
      brand,
      category,
      color,
      debouncedMaxPrice,
      debouncedMinPrice,
      discountOnly,
      searchText,
      section,
      sort,
      subcategory,
    ],
  );

  const {
    items: products,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<Product>(loadProducts);

  // Removes all filters but keeps the search.
  function clearFilters() {
    setBrand("");
    setColor("");
    setDiscountOnly(false);
    setMinPrice("");
    setMaxPrice("");
  }

  const activeFilterCount = [
    brand,
    color,
    discountOnly,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const filterPanel = (
    <ProductFilters
      facets={facets}
      brand={brand}
      color={color}
      discountOnly={discountOnly}
      minPrice={minPrice}
      maxPrice={maxPrice}
      activeFilterCount={activeFilterCount}
      onBrandChange={setBrand}
      onColorChange={setColor}
      onDiscountChange={setDiscountOnly}
      onMinPriceChange={setMinPrice}
      onMaxPriceChange={setMaxPrice}
      onClear={clearFilters}
    />
  );

  return (
    <div className="pb-12 pt-6 sm:pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-gradient-to-r from-accent/10 via-violet-100/60 to-orange-100/70 p-5 dark:from-white/5 dark:via-white/5 dark:to-white/5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-deal">
            {searchText ? "Search" : "Shop"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
            {searchText
              ? `Results for “${searchText}”`
              : pageTitle(
                  categories,
                  category,
                  subcategory,
                  section,
                  requestedDiscount,
                )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="relative px-4 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label="Sort products"
            className="field w-auto pr-9 text-xs font-bold sm:text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          className="card sticky top-32 hidden p-5 md:block"
          aria-label="Product filters"
        >
          {filterPanel}
        </aside>

        <section aria-label="Products">
          {loading ? (
            <GridSkeleton count={12} />
          ) : failed ? (
            <OfflineNotice onRetry={reload} />
          ) : products.length === 0 ? (
            <EmptyProducts
              hasFilters={activeFilterCount > 0}
              onClear={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {cursor && (
                <div className="mt-8">
                  <LoadMoreButton onClick={loadMore} loading={loadingMore} />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <MobileProductFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {filterPanel}
      </MobileProductFilters>
    </div>
  );
}

// Shown when no product matches.
function EmptyProducts({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="card py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mist text-gray-400 dark:bg-white/[0.06]">
        <SearchX className="h-7 w-7" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold">
        No matching products
      </h2>
      {hasFilters && (
        <Button variant="outline" onClick={onClear} className="mt-5">
          Clear filters
        </Button>
      )}
    </div>
  );
}

// Reads a valid sort from the URL.
function readSort(value: string | null): Sort {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as Sort)
    : "latest";
}

// Reads a price filter from the URL.
function readPrice(value: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

// Converts rupees typed by the user to paise.
function rupeesToPaise(value: string) {
  return String(Number(value) * 100);
}

// Page heading from the URL: subcategory, category, section or offers.
function pageTitle(
  categories: Category[],
  category: string,
  subcategory: string,
  section: string,
  discount: boolean,
) {
  for (const parent of categories) {
    if (parent.slug === category && !subcategory) return parent.name;
    const child = parent.children.find((item) => item.slug === subcategory);
    if (child) return child.name;
  }
  if (section === "trending") return "Trending now";
  if (section === "featured") return "Featured for you";
  if (discount) return "Festival sale & best deals";
  return "All products";
}
