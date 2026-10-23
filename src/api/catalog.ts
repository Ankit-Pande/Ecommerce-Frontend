import { publicGet, serverGetPage, serverGetResult } from "@/api/http";
import type {
  ApiData,
  HomeData,
  Paginated,
  Product,
  ProductDetail,
} from "@/lib/types";

const API_SORTS = ["latest", "price_asc", "price_desc", "discount", "rating"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Home page data for server rendering (refreshed every 60 seconds), or null when the API is down.
export async function getHomeOnServer() {
  return (await serverGetResult<HomeData>("/api/home", 60)).data;
}

// Product page data for server rendering, with the status so a missing product can show 404.
export function getProductOnServer(slug: string) {
  return serverGetResult<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`,
    60,
  );
}

// Product page data loaded in the browser.
export async function getProduct(slug: string) {
  return (
    await publicGet<ApiData<ProductDetail>>(
      `/api/products/${encodeURIComponent(slug)}`,
    )
  ).data;
}

// Turns the /products page URL (search, filters, sort) into the catalog API query, ignoring bad values.
export function catalogParams(page: URLSearchParams, cursor?: string) {
  const api = new URLSearchParams({ limit: "24" });
  const search = (page.get("q") ?? "").trim().slice(0, 80);
  const maxPrice = Number(page.get("maxPrice"));
  const minRating = Number(page.get("minRating"));
  const sort = page.get("sort") ?? "";

  if (search.length >= 2) api.set("q", search);
  for (const key of ["category", "subcategory"]) {
    const slug = page.get(key);
    if (slug && SLUG.test(slug)) api.set(key, slug);
  }
  for (const key of ["brand", "color", "size", "gender", "ageGroup"]) {
    const value = page.get(key)?.trim();
    if (value) api.set(key, value.slice(0, 200));
  }
  const section = page.get("section");
  if (section === "trending" || section === "featured") {
    api.set("section", section);
  }
  if (page.get("discount") === "true") api.set("discount", "true");
  if (maxPrice > 0) {
    api.set("maxPricePaise", String(Math.round(maxPrice * 100)));
  }
  if (minRating > 0 && minRating <= 5) api.set("minRating", String(minRating));
  if (API_SORTS.includes(sort)) api.set("sort", sort);
  if (cursor) api.set("cursor", cursor);
  return api;
}

// One page of products, loaded in the browser.
export function getCatalog(params: URLSearchParams) {
  return publicGet<Paginated<Product>>(`/api/catalog?${params}`);
}

// The first page of products for server rendering (refreshed every 60 seconds).
export function getCatalogOnServer(params: URLSearchParams) {
  return serverGetPage<Product>(`/api/catalog?${params}`, 60);
}

// Newest products from the same category as this product.
export async function getRelatedProducts(slug: string) {
  return (
    await publicGet<ApiData<Product[]>>(
      `/api/products/${encodeURIComponent(slug)}/related`,
    )
  ).data;
}
