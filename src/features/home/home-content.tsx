import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { BannerCarousel } from "@/features/home/banner-carousel";
import { CategoryShowcase } from "@/features/home/category-showcase";
import { CategoryShelves } from "@/features/home/category-shelves";
import { ProductCard } from "@/components/product/product-card";
import { ProductScroller } from "@/components/product/product-scroller";
import type { HomeData, Product } from "@/lib/types";

const PRODUCTS_PER_SECTION = 10;

const PROMISES = [
  {
    icon: Truck,
    title: "Free delivery",
    text: "On every order",
    className: "bg-sky-100 text-sky-700",
  },
  {
    icon: ShieldCheck,
    title: "Secure payment",
    text: "UPI, cards, COD",
    className: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    text: "On damaged items",
    className: "bg-amber-100 text-amber-700",
  },
  {
    icon: Headphones,
    title: "Help 7 days",
    text: "Call or email us",
    className: "bg-pink-100 text-pink-700",
  },
];

// Home page sections.
export function HomeContent({ home }: { home: HomeData }) {
  return (
    <div className="pb-12">
      <div className="mt-5 sm:mt-6">
        <BannerCarousel banners={home.banners} />
      </div>

      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-thin lg:grid lg:grid-cols-4 lg:overflow-visible">
        {PROMISES.map((item) => (
          <li
            key={item.title}
            className="flex min-w-[200px] items-center gap-3 rounded-2xl border border-sand bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04] lg:min-w-0"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.className}`}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="block truncate text-xs text-gray-500">
                {item.text}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <CategoryShowcase categories={home.categories} />

      <ProductSection
        title="Trending now"
        href="/products?section=trending"
        products={home.trendingProducts}
      />

      {home.offers.length > 0 && (
        <section className="mt-10 rounded-3xl bg-gradient-to-br from-orange-50 to-pink-50 px-4 pb-5 pt-1 dark:from-white/[0.04] dark:to-white/[0.02] sm:mt-14 sm:px-6">
          <SectionHeader
            title="Festival sale & best deals"
            href="/products?discount=true"
          />
          <ProductScroller label="Festival sale and best deals">
            {home.offers.slice(0, PRODUCTS_PER_SECTION).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductScroller>
        </section>
      )}

      <ProductSection
        title="Featured for you"
        href="/products?section=featured"
        products={home.featuredProducts}
      />
      <CategoryShelves categories={home.categories} />
      <ProductSection
        title="New arrivals"
        href="/products?sort=latest"
        products={home.latestProducts}
      />
    </div>
  );
}

// One titled shelf of products.
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
    <section>
      <SectionHeader title={title} href={href} />
      <ProductScroller label={title}>
        {products.slice(0, PRODUCTS_PER_SECTION).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductScroller>
    </section>
  );
}
