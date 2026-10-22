"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { catalogParams, getCatalog } from "@/api/catalog";
import { ProductCard } from "@/components/product/product-card";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { GridSkeleton } from "@/components/ui/skeletons";
import { useActiveCategory } from "@/hooks/use-active-category";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { tintAt } from "@/lib/colors";
import { categoryHref, subcategoryHref } from "@/lib/links";
import type { Category, Paginated, Product } from "@/lib/types";

const PRICE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Under ₹1,000", value: "1000" },
  { label: "Under ₹5,000", value: "5000" },
  { label: "Under ₹20,000", value: "20000" },
];
const RATING_OPTIONS = [
  { label: "All", value: "" },
  { label: "4.3★ and up", value: "4.3" },
  { label: "4.6★ and up", value: "4.6" },
];
const SORT_OPTIONS = [
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Discount", value: "discount" },
];
const LIST_SORTS = [{ label: "Newest", value: "" }, ...SORT_OPTIONS];
const SEARCH_SORTS = [
  { label: "Relevance", value: "" },
  { label: "Newest", value: "latest" },
  ...SORT_OPTIONS,
];
// The list title: the search words, a section name or "All products".
function pageTitle(page: URLSearchParams) {
  const search = (page.get("q") ?? "").trim();
  if (search.length >= 2) return `Results for "${search}"`;
  if (page.get("section") === "trending") return "Trending";
  if (page.get("section") === "featured") return "Featured";
  if (page.get("discount") === "true") return "Top discounts";
  if (page.get("sort") === "latest") return "New arrivals";
  return "All products";
}

// Product list with subcategory pills, filters, sort and "Load more"; filters live in the URL.
export function ProductListing({
  categories,
  firstPage,
}: {
  categories: Category[];
  firstPage: Paginated<Product> | null;
}) {
  const page = useSearchParams();
  const pageQuery = page.toString();
  const isSearch = (page.get("q") ?? "").trim().length >= 2;
  const { categorySlug, subcategorySlug } = useActiveCategory(categories);
  const categoryIndex = categories.findIndex(
    (item) => item.slug === categorySlug,
  );
  const category = categories[categoryIndex];

  // Loads one page of products for the current URL.
  const loadProducts = useCallback(
    (cursor?: string) =>
      getCatalog(catalogParams(new URLSearchParams(pageQuery), cursor)),
    [pageQuery],
  );
  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<Product>(loadProducts, true, firstPage);

  // Changes one filter in the URL (an empty value removes it).
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(pageQuery);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, "", `/products?${next}`);
  }

  const countText = loading
    ? "…"
    : `${items.length}${cursor ? "+" : ""} ${items.length === 1 ? "product" : "products"}`;

  return (
    <>
      {category ? (
        <section
          className="flex flex-wrap items-center gap-5 rounded-[28px] px-6 py-5"
          style={{ background: tintAt(categoryIndex) }}
        >
          <span className="relative block h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-white">
            <SafeImage
              src={category.image}
              alt=""
              sizes="112px"
              className="object-contain p-3"
            />
          </span>
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2.5">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1.5 font-semibold"
            >
              <Link href="/" className="underline">
                Home
              </Link>
              <span aria-hidden>›</span>
              {subcategorySlug ? (
                <Link href={categoryHref(category.slug)} className="underline">
                  {category.name}
                </Link>
              ) : (
                <span>{category.name}</span>
              )}
              {subcategorySlug && (
                <>
                  <span aria-hidden>›</span>
                  <span>
                    {
                      category.children.find(
                        (child) => child.slug === subcategorySlug,
                      )?.name
                    }
                  </span>
                </>
              )}
            </nav>
            <h1 className="text-[36px] font-extrabold leading-[1.1]">
              {category.name}
            </h1>
            {category.children.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <SubcategoryPill
                  href={categoryHref(category.slug)}
                  active={!subcategorySlug}
                >
                  All
                </SubcategoryPill>
                {category.children.map((child) => (
                  <SubcategoryPill
                    key={child.id}
                    href={subcategoryHref(child.slug)}
                    active={child.slug === subcategorySlug}
                  >
                    {child.name}
                  </SubcategoryPill>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <h1 className="page-title">{pageTitle(page)}</h1>
      )}

      <section
        aria-label="Filters"
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[20px] bg-white px-4 py-3 shadow-card"
      >
        <span className="rounded-full bg-ink px-3.5 py-1 font-semibold text-white">
          {countText}
        </span>
        <ChipGroup
          title="Price"
          options={PRICE_OPTIONS}
          value={page.get("maxPrice") ?? ""}
          onPick={(value) => setFilter("maxPrice", value)}
        />
        <ChipGroup
          title="Rating"
          options={RATING_OPTIONS}
          value={page.get("minRating") ?? ""}
          onPick={(value) => setFilter("minRating", value)}
        />
        <ChipGroup
          title="Sort by"
          options={isSearch ? SEARCH_SORTS : LIST_SORTS}
          value={
            page.get("sort") === "latest" && !isSearch
              ? ""
              : (page.get("sort") ?? "")
          }
          onPick={(value) => setFilter("sort", value)}
        />
      </section>

      {loading ? (
        <GridSkeleton count={12} />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No products found
        </p>
      ) : (
        <>
          <div className="product-grid">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {cursor && (
            <LoadMoreButton onClick={loadMore} loading={loadingMore} />
          )}
        </>
      )}
    </>
  );
}

// A subcategory link pill.
function SubcategoryPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 shrink-0 items-center rounded-full border-2 px-[18px] font-semibold ${active ? "border-accent bg-accent text-white" : "border-line bg-white"}`}
    >
      {children}
    </Link>
  );
}

// A titled group of filter chips; the chosen one is marked as pressed.
function ChipGroup({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={title}
    >
      <span className="font-extrabold">{title}</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onPick(option.value)}
          className="chip"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
