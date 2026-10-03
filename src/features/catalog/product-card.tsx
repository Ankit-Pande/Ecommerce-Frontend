import Link from "next/link";
import { inr, STOCK_TEXT } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { RatingBadge } from "./rating-badge";
import type { Product, StockStatus } from "@/lib/types";

const STOCK_CLASS: Record<StockStatus, string> = {
  IN_STOCK: "text-leaf",
  LOW_STOCK: "text-deal",
  OUT_OF_STOCK: "text-gray-400",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white p-2 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft hover:shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-mist dark:bg-white/[0.06]">
        <SafeImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />

        {product.discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-chrome px-2.5 py-1 text-[10px] font-bold text-white">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="px-2 pb-2 pt-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink transition group-hover:text-accent dark:text-gray-100">
          {product.name}
        </h3>
        <div className="mt-1.5 min-h-5">
          <RatingBadge rating={product.rating} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-lg font-black tracking-tight">
            {inr(product.finalPricePaise)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-xs font-semibold text-deal line-through">
              {inr(product.pricePaise)}
            </span>
          )}
        </div>

        <div className="mt-2 min-h-4">
          <p
            className={`text-[11px] font-extrabold ${STOCK_CLASS[product.stockStatus]}`}
          >
            {STOCK_TEXT[product.stockStatus]}
          </p>
        </div>
      </div>
    </Link>
  );
}
