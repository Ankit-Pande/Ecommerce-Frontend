import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { BannerCarousel } from "@/features/catalog/banner-carousel";
import { CategoryShowcase } from "@/features/catalog/category-showcase";
import { LazyCategoryShelves } from "@/features/catalog/lazy-category-shelves";
import { ProductCard } from "@/features/catalog/product-card";
import { ProductScroller } from "@/features/catalog/product-scroller";
import { RecentlyViewedProducts } from "@/features/catalog/recently-viewed-products";
import type { HomeData, Product } from "@/lib/types";

const PRODUCTS_PER_SECTION = 10;

const PROMOS = [
  {
    href: "/products?discount=true",
    eyebrow: "Festival sale",
    title: "Up to 60% off",
    text: "Fashion, gadgets and home",
    icon: BadgePercent,
    className: "from-orange-500 to-pink-500",
  },
  {
    href: "/products?sort=latest",
    eyebrow: "Just landed",
    title: "New arrivals",
    text: "Fresh picks every day",
    icon: Sparkles,
    className: "from-violet-600 to-accent",
  },
];

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
      <div className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <BannerCarousel banners={home.banners} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
          {PROMOS.map((promo) => (
            <Link
              key={promo.href}
              href={promo.href}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-soft sm:p-6 ${promo.className}`}
            >
              <promo.icon className="absolute -right-3 -top-3 h-24 w-24 opacity-15 sm:h-28 sm:w-28" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
                {promo.eyebrow}
              </span>
              <span>
                <span className="mt-2 block font-display text-lg font-extrabold leading-tight sm:text-2xl">
                  {promo.title}
                </span>
                <span className="mt-1 block text-xs text-white/85">
                  {promo.text}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink transition group-hover:gap-2">
                  Shop now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-sand bg-white p-3 dark:border-white/10 dark:bg-white/[0.04] lg:grid-cols-4">
        {PROMISES.map((item) => (
          <li key={item.title} className="flex items-center gap-3 p-1">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.className}`}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="block text-xs text-gray-500">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <CategoryShowcase categories={home.categories} />
      <RecentlyViewedProducts />

      <ProductSection
        title="Trending now"
        href="/products?section=trending"
        products={home.trendingProducts}
      />

      {home.offers.length > 0 && (
        <section className="mt-10 rounded-3xl bg-gradient-to-br from-orange-50 to-pink-50 px-4 pb-5 pt-1 dark:from-white/[0.04] dark:to-white/[0.02] sm:mt-14 sm:px-6">
          <SectionHeader
            title="Today's best deals"
            href="/products?discount=true"
          />
          <ProductScroller label="Today's best deals">
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
      <LazyCategoryShelves categories={home.categories} />
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
