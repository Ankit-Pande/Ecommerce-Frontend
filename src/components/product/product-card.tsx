import Link from "next/link";
import { CardButtons } from "@/components/product/card-buttons";
import { SafeImage } from "@/components/ui/safe-image";
import { tintFor } from "@/lib/colors";
import { inr, ratingsText } from "@/lib/format";
import type { Product } from "@/lib/types";

// The one product card used in every list.
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-card">
      <Link
        href={href}
        aria-label={product.name}
        className="relative block p-4"
        style={{ background: tintFor(product.id) }}
      >
        <span className="relative block h-[130px]">
          <SafeImage
            src={product.image}
            alt=""
            sizes="(max-width: 640px) 50vw, 220px"
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
            {ratingsText(product.rating.count)}
          </p>
        )}
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-extrabold">
            {inr(product.finalPricePaise)}
          </span>
          {product.discountPercent > 0 && (
            <s className="text-sm text-muted">{inr(product.pricePaise)}</s>
          )}
        </p>
        <div className="mt-auto">
          <CardButtons product={product} />
        </div>
      </div>
    </article>
  );
}
