import Link from "next/link";
import { inr, tintFor } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { CardButtons } from "@/components/product/card-buttons";
import type { Product } from "@/lib/types";

// Product tile with image, discount, rating, price and two small buttons.
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  const soldOut = product.stockStatus === "OUT_OF_STOCK";

  return (
    <article className="card flex flex-col overflow-hidden">
      <Link
        href={href}
        aria-label={product.name}
        className="relative block h-[162px] p-4"
        style={{ background: tintFor(product.id) }}
      >
        <span className="relative block h-full">
          <SafeImage
            src={product.image}
            alt=""
            sizes="240px"
            className={`object-contain ${soldOut ? "opacity-50" : ""}`}
          />
        </span>
        {product.discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-discount px-2.5 py-0.5 text-[13px] font-semibold text-white">
            {product.discountPercent}% off
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={href} className="line-clamp-2 min-h-[46px] font-semibold">
          {product.name}
        </Link>
        {product.rating.count > 0 && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="rounded-full bg-accent px-2 py-px font-semibold text-white">
              ★ {product.rating.average.toFixed(1)}
            </span>
            {product.rating.count.toLocaleString("en-IN")}{" "}
            {product.rating.count === 1 ? "rating" : "ratings"}
          </p>
        )}
        <p className="mt-auto flex flex-wrap items-center gap-2">
          <span className="text-xl font-extrabold">
            {inr(product.finalPricePaise)}
          </span>
          {product.discountPercent > 0 && (
            <s className="text-sm text-muted">{inr(product.pricePaise)}</s>
          )}
        </p>
        {soldOut ? (
          <p className="btn-grey cursor-default text-danger">Out of stock</p>
        ) : (
          <CardButtons productId={product.id} slug={product.slug} />
        )}
      </div>
    </article>
  );
}
