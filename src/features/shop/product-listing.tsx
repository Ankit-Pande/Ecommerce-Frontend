"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCatalog } from "@/api/catalog";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { GridSkeleton } from "@/components/ui/skeletons";
import { ProductCard } from "@/components/product/product-card";
import type { Category, Product } from "@/lib/types";

const PAGE_SIZE = 20;
const MIN_SEARCH_LENGTH = 2;

const PRICE_OPTIONS = [
  { label: "All", value: 0 },
  { label: "Under ₹1,000", value: 1000 },
  { label: "Under ₹5,000", value: 5000 },
  { label: "Under ₹20,000", value: 20000 },
];
const RATING_OPTIONS = [
  { label: "All", value: 0 },
  { label: "3★ and up", value: 3 },
  { label: "4★ and up", value: 4 },
];
const SORT_OPTIONS = [
  { label: "Newest", value: "latest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Discount", value: "discount" },
  { label: "Top rated", value: "rating" },
];

// Product list page; filters start fresh whenever the URL changes.
export function ProductListing({ categories }: { categories: Category[] }) {
  const urlParams = useSearchParams();
  return (
    <Listing
      key={urlParams.toString()}
      categories={categories}
      urlParams={urlParams}
    />
  );
}

function Listing({
  categories,
  urlParams,
}: {
  categories: Category[];
  urlParams: URLSearchParams;
}) {
  const query = urlParams.get("q")?.trim() ?? "";
  const searchText = query.length >= MIN_SEARCH_LENGTH ? query : "";
  const category = urlParams.get("category") ?? "";
  const subcategory = urlParams.get("subcategory") ?? "";

  const [maxPrice, setMaxPrice] = useState(0);
  const [minStars, setMinStars] = useState(0);
  const [sort, setSort] = useState(
    () =>
      SORT_OPTIONS.find((option) => option.value === urlParams.get("sort"))
        ?.value ?? "latest",
  );
  // null: shown on wide screens, hidden on narrow ones, until the user toggles it.
  const [sideOpen, setSideOpen] = useState<boolean | null>(null);

  const loadProducts = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (searchText) params.set("q", searchText);
      for (const key of [
        "category",
        "subcategory",
        "section",
        "brand",
        "color",
      ]) {
        const value = urlParams.get(key);
        if (value) params.set(key, value);
      }
      if (urlParams.get("discount") === "true") params.set("discount", "true");
      if (maxPrice) params.set("maxPricePaise", String(maxPrice * 100));
      if (cursor) params.set("cursor", cursor);
      params.set("sort", sort);
      params.set("limit", String(PAGE_SIZE));
      return getCatalog(params);
    },
    [maxPrice, searchText, sort, urlParams],
  );

  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<Product>(loadProducts);
  // The catalog API has no rating filter, so it runs on the loaded products.
  const products = minStars
    ? items.filter((product) => product.rating.average >= minStars)
    : items;

  return (
    <div className="flex flex-wrap items-start gap-6">
      {sideOpen !== false && (
        <aside
          aria-label="Subcategories"
          className={`card flex-[1_1_260px] flex-col gap-1 p-4 max-w-[320px] ${sideOpen ? "flex" : "hidden min-[900px]:flex"}`}
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-ground px-2 pb-1.5">
            <span className="text-xl font-extrabold text-accent">
              Categories
            </span>
            <button
              type="button"
              onClick={() => setSideOpen(false)}
              className="min-h-10 rounded-[10px] bg-ground px-3.5 text-sm font-semibold"
            >
              Hide
            </button>
          </div>
          {categories.map((parent) => {
            const active =
              parent.slug === category ||
              parent.children.some((child) => child.slug === subcategory);
            return (
              <div key={parent.id}>
                <Link
                  href={`/products?category=${encodeURIComponent(parent.slug)}`}
                  className={`flex min-h-11 items-center px-2 font-extrabold ${active ? "text-accent" : ""}`}
                >
                  {parent.name}
                </Link>
                {active && (
                  <div className="flex flex-col gap-1 pb-2">
                    {parent.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/products?subcategory=${encodeURIComponent(child.slug)}`}
                        className={`flex min-h-11 items-center rounded-[10px] px-3.5 ${child.slug === subcategory ? "bg-soft font-extrabold text-accent" : ""}`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
      )}

      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
        {sideOpen !== true && (
          <button
            type="button"
            onClick={() => setSideOpen(true)}
            className={`btn-primary self-start px-[18px] ${sideOpen === null ? "min-[900px]:hidden" : ""}`}
          >
            ☰ Categories
          </button>
        )}

        <h1 className="text-[32px] font-extrabold leading-tight">
          {searchText
            ? `Results for "${searchText}"`
            : pageTitle(categories, urlParams)}
        </h1>

        <section
          aria-label="Filters"
          className="card flex flex-wrap gap-x-6 gap-y-2 px-4 py-3"
        >
          <ChipGroup
            title="Price"
            options={PRICE_OPTIONS}
            value={maxPrice}
            onPick={setMaxPrice}
          />
          <ChipGroup
            title="Rating"
            options={RATING_OPTIONS}
            value={minStars}
            onPick={setMinStars}
          />
          <ChipGroup
            title="Sort by"
            options={SORT_OPTIONS}
            value={sort}
            onPick={setSort}
          />
        </section>

        {loading ? (
          <GridSkeleton count={12} />
        ) : failed ? (
          <OfflineNotice onRetry={reload} />
        ) : (
          <>
            {products.length === 0 ? (
              <p className="card p-8 text-center font-semibold">
                No products found
              </p>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {cursor && (
              <LoadMoreButton onClick={loadMore} loading={loadingMore} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// One filter row: a title and chips, the picked chip filled.
function ChipGroup<T extends string | number>({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { label: string; value: T }[];
  value: T;
  onPick: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-extrabold">{title}</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onPick(option.value)}
          className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${option.value === value ? "border-accent bg-accent text-white" : "border-line bg-white"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Page heading from the URL: "Category › Subcategory", category, section or offers.
function pageTitle(categories: Category[], urlParams: URLSearchParams) {
  const category = urlParams.get("category");
  const subcategory = urlParams.get("subcategory");
  for (const parent of categories) {
    if (parent.slug === category && !subcategory) return parent.name;
    const child = parent.children.find((item) => item.slug === subcategory);
    if (child) return `${parent.name} › ${child.name}`;
  }
  if (urlParams.get("section") === "trending") return "Trending";
  if (urlParams.get("section") === "featured") return "Featured";
  if (urlParams.get("discount") === "true") return "Top discounts";
  return "All products";
}
