import type { MetadataRoute } from "next";
import { getHomeOnServer } from "@/api/catalog";
import { SITE_URL } from "@/lib/site";

// Lakhs of products cannot fit one sitemap; categories and home products are
// listed here and Google finds the rest through the category pages.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = await getHomeOnServer();
  const pages = ["/", "/products"];

  for (const category of home?.categories ?? []) {
    pages.push(`/products?category=${category.slug}`);
    for (const child of category.children) {
      pages.push(`/products?subcategory=${child.slug}`);
    }
  }

  const products = [
    ...(home?.trendingProducts ?? []),
    ...(home?.featuredProducts ?? []),
    ...(home?.latestProducts ?? []),
    ...(home?.offers ?? []),
  ];
  for (const slug of new Set(products.map((product) => product.slug))) {
    pages.push(`/products/${slug}`);
  }

  return pages.map((path) => ({ url: `${SITE_URL}${path}` }));
}
