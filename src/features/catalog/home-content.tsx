import { SectionHeader } from "@/components/ui/section-header";
import { BannerCarousel } from "@/features/catalog/banner-carousel";
import { CategoryShowcase } from "@/features/catalog/category-showcase";
import { LazyCategoryShelves } from "@/features/catalog/lazy-category-shelves";
import { ProductCard } from "@/features/catalog/product-card";
import { ProductScroller } from "@/features/catalog/product-scroller";
import { RecentlyViewedProducts } from "@/features/catalog/recently-viewed-products";
import type { HomeData, Product } from "@/lib/types";

const PRODUCTS_PER_SECTION = 8;

// Home page sections.
export function HomeContent({ home }: { home: HomeData }) {
  return (
    <div className="pb-12">
      <BannerCarousel banners={home.banners} />
      <CategoryShowcase categories={home.categories} />
      <RecentlyViewedProducts />

      <ProductSection
        title="Trending now"
        href="/products?section=trending"
        products={home.trendingProducts}
      />
      <ProductSection
        title="Discount offers"
        href="/products?discount=true"
        products={home.offers}
      />
      <ProductSection
        title="Featured"
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
