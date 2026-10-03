import { publicGet, serverGet, serverGetResult } from "@/api/http";
import type {
  ApiData,
  HomeData,
  Paginated,
  Product,
  ProductDetail,
  ProductFacets,
} from "@/lib/types";

// Server pages are rebuilt in the background after these many seconds (ISR).
const HOME_REVALIDATE_SECONDS = 60;
const PRODUCT_REVALIDATE_SECONDS = 300;

/** Server only. Returns null when the backend is down, so the page still renders. */
export function getHomeOnServer() {
  return serverGet<HomeData>("/api/home", HOME_REVALIDATE_SECONDS);
}

/** Server only. Keeps the status so a real 404 differs from an offline backend. */
export function getProductOnServer(slug: string) {
  return serverGetResult<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`,
    PRODUCT_REVALIDATE_SECONDS,
  );
}

export async function getProduct(slug: string) {
  const res = await publicGet<ApiData<ProductDetail>>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

export function getCatalog(params: URLSearchParams) {
  return publicGet<Paginated<Product>>(`/api/catalog?${params}`);
}

export async function getCatalogFilters(params: URLSearchParams) {
  const res = await publicGet<ApiData<ProductFacets>>(
    `/api/catalog/filters?${params}`,
  );
  return res.data;
}

export async function getRelatedProducts(slug: string) {
  const res = await publicGet<ApiData<Product[]>>(
    `/api/products/${encodeURIComponent(slug)}/related`,
  );
  return res.data;
}

export async function getProductsBySlugs(slugs: string[]) {
  const res = await publicGet<ApiData<Product[]>>(
    `/api/products/batch?slugs=${encodeURIComponent(slugs.join(","))}`,
  );
  return res.data;
}
