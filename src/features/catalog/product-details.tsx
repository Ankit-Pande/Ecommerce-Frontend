import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { inr, STOCK_TEXT } from "@/lib/format";
import { catalogHref } from "@/lib/catalog-fallback";
import { safeColor } from "@/lib/sanitize";
import { AddToCart } from "@/features/catalog/add-to-cart";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductReviews } from "@/features/catalog/product-reviews";
import { RatingBadge } from "@/features/catalog/rating-badge";
import { RelatedProducts } from "@/features/catalog/related-products";
import { RecentProductTracker } from "@/features/catalog/recently-viewed-products";
import type { ProductDetail } from "@/lib/types";

export function ProductDetails({ product }: { product: ProductDetail }) {
  const saving = product.pricePaise - product.finalPricePaise;
  const swatch = safeColor(product.color);
  const inStock = product.stockStatus !== "OUT_OF_STOCK";
  // Products live in a subcategory; a top-level category has no parent.
  const categoryLink = product.category.parent
    ? catalogHref(product.category, "subcategory")
    : catalogHref(product.category);

  return (
    <div className="pb-10 pt-5 sm:pt-7">
      <RecentProductTracker slug={product.slug} />
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 overflow-hidden text-xs font-semibold text-gray-500"
      >
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href="/products" className="hover:text-accent">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link
          href={categoryLink}
          className="hidden hover:text-accent sm:inline"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
        <span className="truncate text-gray-700 dark:text-gray-300">
          {product.name}
        </span>
      </nav>

      <div className="card grid gap-7 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-10 lg:p-8">
        <ProductGallery
          key={product.id}
          images={product.images}
          name={product.name}
        />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={categoryLink}
              className="eyebrow rounded-full bg-accent/[0.07] px-2.5 py-1"
            >
              {product.category.name}
            </Link>
            {product.brand && (
              <Link
                href={`/products?brand=${encodeURIComponent(product.brand.slug)}`}
                className="rounded-full bg-mist px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-600 transition hover:text-accent dark:bg-white/[0.07] dark:text-gray-300"
              >
                {product.brand.name}
              </Link>
            )}
            {product.color && (
              <Link
                href={`${categoryLink}&color=${encodeURIComponent(product.color)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-600 transition hover:text-accent dark:bg-white/[0.07] dark:text-gray-300"
              >
                {swatch && (
                  <span
                    className="h-3 w-3 rounded-full border border-black/15"
                    style={{ backgroundColor: swatch }}
                  />
                )}
                {product.color}
              </Link>
            )}
          </div>

          <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <div className="mt-2">
            <RatingBadge rating={product.rating} />
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {inr(product.finalPricePaise)}
            </span>
            {saving > 0 && (
              <>
                <span className="pb-1 text-sm font-semibold text-gray-400 line-through">
                  {inr(product.pricePaise)}
                </span>
                <span className="mb-1 rounded-full bg-deal/10 px-2.5 py-1 text-xs font-extrabold text-deal">
                  Save {inr(saving)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-500">
            Inclusive of all taxes
          </p>

          <div className="mt-5 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-accent" : "bg-gray-300"}`}
            />
            <span
              className={`text-sm font-extrabold ${inStock ? "text-accent" : "text-gray-500"}`}
            >
              {STOCK_TEXT[product.stockStatus]}
            </span>
          </div>

          <div className="mt-6 border-t border-sand pt-6 dark:border-white/10">
            <h2 className="text-sm font-extrabold">Product details</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">
              {product.description}
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-mist/70 p-4 text-xs dark:bg-white/[0.05]">
            <ProductFact label="Category" value={product.category.name} />
            {product.brand && (
              <ProductFact label="Brand" value={product.brand.name} />
            )}
            {product.color && (
              <ProductFact label="Colour" value={product.color} />
            )}
          </dl>

          <div className="mt-7">
            <AddToCart productId={product.id} inStock={inStock} />
          </div>
        </div>
      </div>

      <ProductReviews slug={product.slug} rating={product.rating} />
      <RelatedProducts slug={product.slug} categoryLink={categoryLink} />
    </div>
  );
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 truncate font-bold text-gray-700 dark:text-gray-200">
        {value}
      </dd>
    </div>
  );
}
