import Link from "next/link";
import { catalogHref, inr, STOCK_TEXT } from "@/lib/format";
import { AddToCart } from "@/features/product/add-to-cart";
import { ProductGallery } from "@/features/product/product-gallery";
import { ProductReviews } from "@/features/product/product-reviews";
import { RelatedProducts } from "@/features/product/related-products";
import type { ProductDetail } from "@/lib/types";

const CHIP = "rounded-[10px] bg-ground px-3 py-2 font-semibold";

// Product page: gallery, info and buttons, reviews and related products.
export function ProductDetails({ product }: { product: ProductDetail }) {
  const inStock = product.stockStatus !== "OUT_OF_STOCK";
  const categoryLink = product.category.parent
    ? catalogHref(product.category, "subcategory")
    : catalogHref(product.category);
  const facts = [
    ...(product.brand ? [["Brand", product.brand.name]] : []),
    ...(product.color ? [["Colour", product.color]] : []),
    ...Object.entries(product.specs ?? {}),
  ];

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-wrap items-start gap-6">
        <ProductGallery
          key={product.id}
          id={product.id}
          images={product.images}
          name={product.name}
        />

        <div className="card flex flex-[1_1_320px] flex-col items-start gap-3.5 rounded-[28px] p-6">
          <Link href={categoryLink} className="font-extrabold text-accent">
            {product.category.name}
          </Link>
          <h1 className="text-[28px] font-extrabold leading-[1.15] sm:text-[34px]">
            {product.name}
          </h1>
          {product.rating.count > 0 && (
            <p className="text-muted">
              ★ {product.rating.average.toFixed(1)} rating
            </p>
          )}
          <p className="flex flex-wrap items-baseline gap-3">
            <span className="text-[40px] font-extrabold leading-none">
              {inr(product.finalPricePaise)}
            </span>
            {product.discountPercent > 0 && (
              <>
                <s className="text-lg text-muted">{inr(product.pricePaise)}</s>
                <span className="rounded-full bg-discount px-3 py-1 font-semibold text-white">
                  {product.discountPercent}% off
                </span>
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className={`${CHIP} ${inStock ? "" : "text-danger"}`}>
              {STOCK_TEXT[product.stockStatus]}
            </span>
            <span className={CHIP}>Cash on Delivery available</span>
            <span className={CHIP}>UPI, cards, net banking</span>
          </div>
          {inStock && <AddToCart productId={product.id} slug={product.slug} />}
          <p className="whitespace-pre-line text-muted">
            {product.description}
          </p>
          {facts.length > 0 && (
            <dl className="grid w-full grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 rounded-2xl bg-soft p-4">
              {facts.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="truncate font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <ProductReviews
        slug={product.slug}
        image={product.images[0] ?? null}
        rating={product.rating}
      />
      <RelatedProducts slug={product.slug} />
    </div>
  );
}
