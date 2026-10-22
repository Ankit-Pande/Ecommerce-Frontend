import Link from "next/link";
import { AddToCart } from "@/features/product/add-to-cart";
import { ProductGallery } from "@/features/product/product-gallery";
import { ProductReviews } from "@/features/product/product-reviews";
import { RelatedProducts } from "@/features/product/related-products";
import { tintIndexFor } from "@/lib/colors";
import { inr, ratingsText } from "@/lib/format";
import { categoryHref, subcategoryHref } from "@/lib/links";
import type { ProductDetail } from "@/lib/types";

const STOCK_TEXT = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Only a few left",
  OUT_OF_STOCK: "Out of stock",
};

// Product page: breadcrumb, gallery, price, options, details, reviews and related products.
export function ProductDetails({ product }: { product: ProductDetail }) {
  const { category } = product;
  const categoryLink = category.parent
    ? subcategoryHref(category.slug)
    : categoryHref(category.slug);
  const details = [
    ["Category", category.name],
    ...(product.brand ? [["Brand", product.brand.name]] : []),
    [
      "Rating",
      product.rating.count > 0
        ? `${product.rating.average.toFixed(1)} out of 5`
        : "No ratings yet",
    ],
    ["Availability", STOCK_TEXT[product.stockStatus]],
    ["Payment", "UPI, cards, net banking, Cash on Delivery"],
    ...Object.entries(product.specs ?? {}),
  ];

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 font-semibold"
      >
        <Link href="/" className="underline">
          Home
        </Link>
        <span aria-hidden>›</span>
        <Link href={categoryLink} className="underline">
          {category.name}
        </Link>
        <span aria-hidden>›</span>
        <span className="min-w-0 truncate">{product.name}</span>
      </nav>

      <section className="flex flex-wrap gap-6 rounded-[28px] bg-white p-4 shadow-card">
        <ProductGallery
          key={product.id}
          images={product.images}
          name={product.name}
          tintIndex={tintIndexFor(product.id)}
          discountPercent={product.discountPercent}
        />

        <div className="flex min-w-0 flex-[1_1_320px] flex-col items-start gap-3.5 p-2">
          <h1 className="text-[28px] font-extrabold leading-[1.15] sm:text-[34px]">
            {product.name}
          </h1>
          {product.rating.count > 0 && (
            <p className="flex items-center gap-2 text-muted">
              <span className="rounded-full bg-accent px-3 py-0.5 font-extrabold text-white">
                ★ {product.rating.average.toFixed(1)}
              </span>
              {ratingsText(product.rating.count)}
            </p>
          )}
          <div className="flex w-full flex-wrap items-baseline gap-3 rounded-[18px] bg-soft px-4 py-3.5">
            <span className="text-[40px] font-extrabold leading-none">
              {inr(product.finalPricePaise)}
            </span>
            {product.discountPercent > 0 && (
              <>
                <s className="text-lg text-muted">{inr(product.pricePaise)}</s>
                <span className="font-extrabold text-discount">
                  {product.discountPercent}% off
                </span>
              </>
            )}
          </div>
          {product.stockStatus === "OUT_OF_STOCK" ? (
            <p className="rounded-xl bg-[#FFD9D9] px-4 py-2.5 font-semibold text-[#8E1B1B]">
              Out of stock
            </p>
          ) : (
            <AddToCart product={product} />
          )}
          <dl className="w-full overflow-hidden rounded-[18px] border border-line">
            {details.map(([label, value], index) => (
              <div
                key={index}
                className="flex flex-wrap gap-x-3 gap-y-1 border-b border-ground px-3.5 py-2.5 last:border-b-0"
              >
                <dt className="flex-[0_0_120px] text-muted">{label}</dt>
                <dd className="min-w-0 flex-[1_1_120px] font-semibold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="whitespace-pre-line text-muted">
            {product.description}
          </p>
        </div>
      </section>

      <ProductReviews product={product} />
      <RelatedProducts slug={product.slug} />
    </>
  );
}
