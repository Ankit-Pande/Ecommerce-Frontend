import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeader } from "@/components/ui/section-header";
import { BannerCarousel } from "@/features/home/banner-carousel";
import { CategoryShowcase } from "@/features/home/category-showcase";
import { ProductCard } from "@/components/product/product-card";
import { catalogHref } from "@/lib/format";
import type { HomeData, Product } from "@/lib/types";

const PRODUCTS_PER_SECTION = 8;
const OFFER_COLORS = ["#C7421F", "#5B3FC4"];

// Home page sections.
export function HomeContent({ home }: { home: HomeData }) {
  return (
    <div className="flex flex-col gap-7">
      <BannerCarousel banners={home.banners} categories={home.categories} />
      <CategoryShowcase categories={home.categories} />

      {home.categories.length > 0 && (
        <section
          aria-label="Banners"
          className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4"
        >
          {home.categories.slice(0, 2).map((category, index) => (
            <Link
              key={category.id}
              href={catalogHref(category)}
              className="flex items-center gap-4 rounded-[20px] px-6 py-5 text-white"
              style={{ background: OFFER_COLORS[index] }}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[26px] font-extrabold">
                  {category.name}
                </span>
                <span className="block">
                  {category.children
                    .slice(0, 3)
                    .map((child) => child.name)
                    .join(", ")}
                </span>
              </span>
              <span className="relative block h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full bg-white">
                <SafeImage
                  src={category.image}
                  alt=""
                  sizes="92px"
                  className="object-contain p-2.5"
                />
              </span>
            </Link>
          ))}
        </section>
      )}

      <ProductSection
        title="Trending"
        href="/products?section=trending"
        products={home.trendingProducts}
      />
      <ProductSection
        title="Top discounts"
        href="/products?discount=true"
        products={home.offers}
      />
      <ProductSection
        title="New arrivals"
        href="/products?sort=latest"
        products={home.latestProducts}
      />
    </div>
  );
}

// One titled grid of products.
function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title={title} href={href} />
      <div className="product-grid">
        {products.slice(0, PRODUCTS_PER_SECTION).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
