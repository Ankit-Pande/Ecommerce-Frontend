import { publicGet, serverGet, serverGetResult } from "@/api/http";
import type {
  ApiData,
  HomeData,
  Paginated,
  Product,
  ProductDetail,
  ProductFacets,
} from "@/lib/types";

const HOME_REVALIDATE_SECONDS = 60;
const PRODUCT_REVALIDATE_SECONDS = 300;

// Home data on the server; null when the backend is down.
export function getHomeOnServer() {
  return serverGet<HomeData>("/api/home", HOME_REVALIDATE_SECONDS);
}

// One product on the server; keeps the status to tell 404 from offline.
export function getProductOnServer(slug: string) {
  return serverGetResult<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`,
    PRODUCT_REVALIDATE_SECONDS,
  );
}

// One product from the browser.
export async function getProduct(slug: string) {
  const res = await publicGet<ApiData<ProductDetail>>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

// Product list for search and filters.
export function getCatalog(params: URLSearchParams) {
  return publicGet<Paginated<Product>>(`/api/catalog?${params}`);
}

// Brands, colours and price range for a category.
export async function getCatalogFilters(params: URLSearchParams) {
  const res = await publicGet<ApiData<ProductFacets>>(
    `/api/catalog/filters?${params}`,
  );
  return res.data;
}

// Products from the same category.
export async function getRelatedProducts(slug: string) {
  const res = await publicGet<ApiData<Product[]>>(
    `/api/products/${encodeURIComponent(slug)}/related`,
  );
  return res.data;
}

// Products by slug, for recently viewed.
export async function getProductsBySlugs(slugs: string[]) {
  const res = await publicGet<ApiData<Product[]>>(
    `/api/products/batch?slugs=${encodeURIComponent(slugs.join(","))}`,
  );
  return res.data;
}
