import type { MetadataRoute } from "next";
import { getHomeOnServer } from "@/api/catalog";
import { categoryHref, subcategoryHref } from "@/lib/links";
import { SITE_URL } from "@/lib/site";

// sitemap.xml: home, categories, subcategories and the products shown on the home page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = await getHomeOnServer();
  const pages = ["/", "/products"];

  for (const category of home?.categories ?? []) {
    pages.push(categoryHref(category.slug));
    for (const child of category.children) {
      pages.push(subcategoryHref(child.slug));
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
