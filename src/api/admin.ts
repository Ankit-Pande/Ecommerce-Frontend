import { http } from "@/api/http";
import type {
  AdminBanner,
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminProductDetail,
  AdminStats,
  AdminUser,
  ApiData,
  OrderStatus,
  Paginated,
} from "@/lib/types";

// Query for one admin list page: 20 rows, the filters and the cursor.
function pageParams(cursor?: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ limit: "20", ...filters });
  if (cursor) params.set("cursor", cursor);
  return params;
}

// Today's numbers for the admin home.
export async function getStats() {
  return (await http.get<ApiData<AdminStats>>("/api/admin/stats")).data;
}

// One page of all orders, filtered by status or "needs review".
export function listOrders(
  cursor: string | undefined,
  filters: { status?: OrderStatus; needsReview?: boolean },
) {
  const params = pageParams(cursor, {
    ...(filters.status && { status: filters.status }),
    ...(filters.needsReview && { needsReview: "true" }),
  });
  return http.get<Paginated<AdminOrder>>(`/api/admin/orders?${params}`);
}

// Ships, delivers or cancels an order.
export function updateOrderStatus(
  id: string,
  status: "SHIPPED" | "DELIVERED" | "CANCELLED",
) {
  return http.patch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    status,
  });
}

// Records that a payment under review was refunded.
export function markOrderRefunded(id: string) {
  return http.patch(`/api/admin/orders/${encodeURIComponent(id)}/refunded`);
}

// One page of all products, searchable by name.
export function listProducts(cursor: string | undefined, search: string) {
  const params = pageParams(cursor, search ? { q: search } : {});
  return http.get<Paginated<AdminProduct>>(`/api/admin/products?${params}`);
}

// One product with every field for the edit form.
export async function getProduct(id: string) {
  return (
    await http.get<ApiData<AdminProductDetail>>(
      `/api/admin/products/${encodeURIComponent(id)}`,
    )
  ).data;
}

// Creates a product from the form (with images).
export function createProduct(form: FormData) {
  return http.postForm("/api/admin/products", form);
}

// Saves the edit form of a product.
export function updateProduct(id: string, form: FormData) {
  return http.patchForm(`/api/admin/products/${encodeURIComponent(id)}`, form);
}

// Hides a product from the store.
export function hideProduct(id: string) {
  return http.delete(`/api/admin/products/${encodeURIComponent(id)}`);
}

// Uploads images and returns their URLs.
export async function uploadImages(form: FormData) {
  return (await http.postForm<ApiData<string[]>>("/api/admin/uploads", form))
    .data;
}

// Creates many products at once.
export async function bulkCreateProducts(products: unknown[]) {
  return (
    await http.post<ApiData<{ created: number; skipped: string[] }>>(
      "/api/admin/products/bulk",
      { products },
    )
  ).data;
}

// Sets one discount on all products or on one category.
export async function applySale(data: {
  categoryId?: string;
  discountPercent: number;
  offerEndsAt?: string;
}) {
  return (
    await http.post<ApiData<{ updated: number }>>(
      "/api/admin/products/sale",
      data,
    )
  ).data;
}

// All categories with their subcategories.
export async function listCategories() {
  return (await http.get<ApiData<AdminCategory[]>>("/api/admin/categories"))
    .data;
}

// Creates a category from the form.
export function createCategory(form: FormData) {
  return http.postForm("/api/admin/categories", form);
}

// Saves a category form.
export function updateCategory(id: string, form: FormData) {
  return http.patchForm(
    `/api/admin/categories/${encodeURIComponent(id)}`,
    form,
  );
}

// Deletes an empty category.
export function deleteCategory(id: string) {
  return http.delete(`/api/admin/categories/${encodeURIComponent(id)}`);
}

// All brands.
export async function listBrands() {
  return (await http.get<ApiData<AdminBrand[]>>("/api/admin/brands")).data;
}

// Creates a brand from the form.
export function createBrand(form: FormData) {
  return http.postForm("/api/admin/brands", form);
}

// Renames, hides or shows a brand.
export async function updateBrand(
  id: string,
  data: { name?: string; isActive?: boolean },
) {
  return (
    await http.patch<ApiData<AdminBrand>>(
      `/api/admin/brands/${encodeURIComponent(id)}`,
      data,
    )
  ).data;
}

// Deletes a brand that has no products.
export function deleteBrand(id: string) {
  return http.delete(`/api/admin/brands/${encodeURIComponent(id)}`);
}

// All home page banners.
export async function listBanners() {
  return (await http.get<ApiData<AdminBanner[]>>("/api/admin/banners")).data;
}

// Creates a banner from the form.
export function createBanner(form: FormData) {
  return http.postForm("/api/admin/banners", form);
}

// Changes a banner's link, position or visibility.
export async function updateBanner(
  id: string,
  data: { link?: string | null; position?: number; isActive?: boolean },
) {
  return (
    await http.patch<ApiData<AdminBanner>>(
      `/api/admin/banners/${encodeURIComponent(id)}`,
      data,
    )
  ).data;
}

// Deletes a banner.
export function deleteBanner(id: string) {
  return http.delete(`/api/admin/banners/${encodeURIComponent(id)}`);
}

// Deletes a review.
export function deleteReview(id: string) {
  return http.delete(`/api/admin/reviews/${encodeURIComponent(id)}`);
}

// One page of customers, searchable by phone.
export function listUsers(cursor: string | undefined, phone: string) {
  const params = pageParams(cursor, phone ? { q: phone } : {});
  return http.get<Paginated<AdminUser>>(`/api/admin/users?${params}`);
}

// Blocks or unblocks a user.
export function setUserBlocked(id: string, isBlocked: boolean) {
  return http.patch(`/api/admin/users/${encodeURIComponent(id)}/block`, {
    isBlocked,
  });
}

// Makes a user an admin or a normal user.
export function setUserRole(id: string, role: "USER" | "ADMIN") {
  return http.patch(`/api/admin/users/${encodeURIComponent(id)}/role`, {
    role,
  });
}
