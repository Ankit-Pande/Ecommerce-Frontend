import Link from "next/link";
import { ChevronRight, RotateCcw, Truck, Wallet } from "lucide-react";
import { inr, STOCK_TEXT } from "@/lib/format";
import { catalogHref } from "@/lib/format";
import { safeColor } from "@/lib/sanitize";
import { AddToCart } from "@/features/catalog/add-to-cart";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductReviews } from "@/features/catalog/product-reviews";
import { RatingBadge } from "@/features/catalog/rating-badge";
import { RelatedProducts } from "@/features/catalog/related-products";
import type { ProductDetail } from "@/lib/types";

// Product info: price, stock, details and buttons.
export function ProductDetails({ product }: { product: ProductDetail }) {
  const saving = product.pricePaise - product.finalPricePaise;
  const swatch = safeColor(product.color);
  const inStock = product.stockStatus !== "OUT_OF_STOCK";
  const categoryLink = product.category.parent
    ? catalogHref(product.category, "subcategory")
    : catalogHref(product.category);

  return (
    <div className="pb-10 pt-5 sm:pt-7">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-600 dark:bg-white/[0.07] dark:text-gray-300">
                {swatch && (
                  <span
                    className="h-3 w-3 rounded-full border border-black/15"
                    style={{ backgroundColor: swatch }}
                  />
                )}
                {product.color}
              </span>
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
                <span className="mb-1 rounded-lg bg-leaf/10 px-2.5 py-1 text-xs font-extrabold text-leaf">
                  {product.discountPercent}% off · Save {inr(saving)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-500">
            Inclusive of all taxes
          </p>

          <div className="mt-5 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-leaf" : "bg-gray-300"}`}
            />
            <span
              className={`text-sm font-extrabold ${product.stockStatus === "LOW_STOCK" ? "text-deal" : inStock ? "text-leaf" : "text-gray-500"}`}
            >
              {STOCK_TEXT[product.stockStatus]}
            </span>
          </div>

          <div className="mt-6">
            <AddToCart
              productId={product.id}
              slug={product.slug}
              inStock={inStock}
            />
          </div>

          <ul className="mt-6 divide-y divide-sand rounded-2xl border border-sand text-sm dark:divide-white/10 dark:border-white/10">
            <DeliveryLine
              icon={Truck}
              title="Free delivery"
              text="Delivered in 2-5 days across India"
            />
            <DeliveryLine
              icon={Wallet}
              title="Cash on delivery"
              text="Pay when the order reaches you"
            />
            <DeliveryLine
              icon={RotateCcw}
              title="Easy returns"
              text="Replacement for damaged items"
            />
          </ul>

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
            {Object.entries(product.specs ?? {}).map(([key, value]) => (
              <ProductFact key={key} label={key} value={value} />
            ))}
          </dl>
        </div>
      </div>

      <ProductReviews slug={product.slug} rating={product.rating} />
      <RelatedProducts slug={product.slug} categoryLink={categoryLink} />
    </div>
  );
}

// One delivery promise row with a coloured icon.
function DeliveryLine({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Truck;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-gray-500">{text}</span>
      </span>
    </li>
  );
}

// One label and value row.
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
