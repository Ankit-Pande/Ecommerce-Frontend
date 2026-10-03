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
  UserRole,
} from "@/lib/types";

const PAGE_SIZE = "20";

// Builds cursor and filter query params for admin lists.
function listParams(cursor?: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ limit: PAGE_SIZE, ...extra });
  if (cursor) params.set("cursor", cursor);
  return params;
}

// Uploads images and returns their URLs.
export async function uploadImages(form: FormData) {
  return (await http.postForm<ApiData<string[]>>("/api/admin/uploads", form))
    .data;
}

// Admin product list, including hidden products.
export function listProducts(cursor: string | undefined, q: string) {
  const params = listParams(cursor, q ? { q } : {});
  return http.get<Paginated<AdminProduct>>(`/api/admin/products?${params}`);
}

// One product for the edit form.
export async function getProduct(id: string) {
  return (
    await http.get<ApiData<AdminProductDetail>>(`/api/admin/products/${id}`)
  ).data;
}

// Creates a product with images.
export function createProduct(form: FormData) {
  return http.postForm("/api/admin/products", form);
}

// Updates a product; new images are optional.
export function updateProduct(id: string, form: FormData) {
  return http.patchForm(`/api/admin/products/${id}`, form);
}

// Hides a product from the store.
export function hideProduct(id: string) {
  return http.delete(`/api/admin/products/${id}`);
}

// Creates many products in one request.
export async function bulkCreateProducts(products: unknown[]) {
  const res = await http.post<ApiData<{ created: number; skipped: string[] }>>(
    "/api/admin/products/bulk",
    { products },
  );
  return res.data;
}

// All categories, including hidden ones.
export async function listCategories() {
  return (await http.get<ApiData<AdminCategory[]>>("/api/admin/categories"))
    .data;
}

// Creates a category or subcategory.
export function createCategory(form: FormData) {
  return http.postForm("/api/admin/categories", form);
}

// Updates a category.
export function updateCategory(id: string, form: FormData) {
  return http.patchForm(`/api/admin/categories/${id}`, form);
}

// Deletes a category.
export function deleteCategory(id: string) {
  return http.delete(`/api/admin/categories/${id}`);
}

// All brands.
export async function listBrands() {
  return (await http.get<ApiData<AdminBrand[]>>("/api/admin/brands")).data;
}

// Creates a brand with an optional logo.
export function createBrand(form: FormData) {
  return http.postForm("/api/admin/brands", form);
}

// Deletes a brand.
export function deleteBrand(id: string) {
  return http.delete(`/api/admin/brands/${id}`);
}

// All home banners.
export async function listBanners() {
  return (await http.get<ApiData<AdminBanner[]>>("/api/admin/banners")).data;
}

// Creates a home banner.
export function createBanner(form: FormData) {
  return http.postForm("/api/admin/banners", form);
}

// Deletes a banner.
export function deleteBanner(id: string) {
  return http.delete(`/api/admin/banners/${id}`);
}

// Numbers for the admin dashboard.
export async function getStats() {
  return (await http.get<ApiData<AdminStats>>("/api/admin/stats")).data;
}

// Orders by status, or only the ones that need a refund.
export function listOrders(
  cursor: string | undefined,
  status: string,
  needsReview = false,
) {
  const params = listParams(cursor, {
    ...(status && { status }),
    ...(needsReview && { needsReview: "true" }),
  });
  return http.get<Paginated<AdminOrder>>(`/api/admin/orders?${params}`);
}

// Moves an order to its next status.
export function updateOrderStatus(id: string, status: OrderStatus) {
  return http.patch(`/api/admin/orders/${id}/status`, { status });
}

// Records a refund done from the Razorpay dashboard.
export function markOrderRefunded(id: string) {
  return http.patch(`/api/admin/orders/${id}/refunded`);
}

// Removes a customer review.
export function deleteReview(id: string) {
  return http.delete(`/api/admin/reviews/${id}`);
}

// Customer list.
export function listUsers(cursor: string | undefined, q: string) {
  const params = listParams(cursor, q ? { q } : {});
  return http.get<Paginated<AdminUser>>(`/api/admin/users?${params}`);
}

// Blocks or unblocks a customer.
export function setUserBlocked(id: string, isBlocked: boolean) {
  return http.patch(`/api/admin/users/${id}/block`, { isBlocked });
}

// Makes a user admin or customer (super admin only).
export function setUserRole(
  id: string,
  role: Exclude<UserRole, "SUPER_ADMIN">,
) {
  return http.patch(`/api/admin/users/${id}/role`, { role });
}
