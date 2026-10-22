import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { SafeImage } from "@/components/ui/safe-image";
import { BannerCarousel } from "@/features/home/banner-carousel";
import { tintAt } from "@/lib/colors";
import { categoryHref } from "@/lib/links";
import type { HomeData, Product } from "@/lib/types";

// Home page: slides, categories and the product rows.
export function HomeContent({ home }: { home: HomeData }) {
  return (
    <>
      <BannerCarousel banners={home.banners} categories={home.categories} />

      {home.categories.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Shop by category</h2>
          <div className="flex snap-x snap-proximity gap-3.5 overflow-x-auto px-0.5 pb-2.5 pt-1">
            {home.categories.map((category, index) => (
              <Link
                key={category.id}
                href={categoryHref(category.slug)}
                className="flex w-[116px] shrink-0 snap-start flex-col items-center gap-2 text-center font-semibold"
              >
                <span
                  className="relative h-[104px] w-[104px] overflow-hidden rounded-full border-4 border-white shadow-[0_6px_16px_rgba(15,42,46,.12)]"
                  style={{ background: tintAt(index) }}
                >
                  <SafeImage
                    src={category.image}
                    alt=""
                    sizes="104px"
                    className="object-contain p-4"
                  />
                </span>
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow
        title="Trending"
        color="#C7421F"
        href="/products?section=trending"
        products={home.trendingProducts}
      />
      <ProductRow
        title="Top discounts"
        color="#5B3FC4"
        href="/products?discount=true&sort=discount"
        products={home.offers}
      />
      <ProductRow
        title="New arrivals"
        color="#E0A100"
        href="/products?sort=latest"
        products={home.latestProducts}
      />
    </>
  );
}

// One titled row of products with a "View all" link.
function ProductRow({
  title,
  color,
  href,
  products,
}: {
  title: string;
  color: string;
  href: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-7 w-2.5 rounded-full"
            style={{ background: color }}
          />
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center rounded-full bg-white px-4 font-extrabold text-accent"
        >
          View all ›
        </Link>
      </div>
      <div className="scroll-row">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
