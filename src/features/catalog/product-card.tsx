import Link from "next/link";
import { inr } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { QuickAdd } from "./quick-add";
import { RatingBadge } from "./rating-badge";
import type { Product } from "@/lib/types";

// Product tile with image, price, discount, rating and a quick add button.
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  const soldOut = product.stockStatus === "OUT_OF_STOCK";

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-sand/70 bg-white p-2.5 transition duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden rounded-xl bg-mist dark:bg-white/[0.06]"
      >
        <SafeImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className={`object-contain p-4 transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-50" : ""}`}
        />
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-deal px-2 py-1 text-[10px] font-extrabold text-white">
            -{product.discountPercent}%
          </span>
        )}
        {product.stockStatus !== "IN_STOCK" && (
          <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-deal">
            {soldOut ? "Sold out" : "Only few left"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <Link
          href={href}
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink transition hover:text-accent dark:text-gray-100"
        >
          {product.name}
        </Link>
        <div className="mt-1 min-h-5">
          <RatingBadge rating={product.rating} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold sm:text-lg">
              {inr(product.finalPricePaise)}
            </p>
            {product.discountPercent > 0 && (
              <p className="text-[11px] font-semibold">
                <span className="text-gray-400 line-through">
                  {inr(product.pricePaise)}
                </span>{" "}
                <span className="text-leaf">
                  {product.discountPercent}% off
                </span>
              </p>
            )}
          </div>
          {!soldOut && <QuickAdd productId={product.id} />}
        </div>
      </div>
    </article>
  );
}
