import { http } from "@/api/http";
import type {
  AdminBanner,
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminProductDetail,
  AdminUser,
  ApiData,
  OrderStatus,
  Paginated,
  UserRole,
} from "@/lib/types";

// Forms with images go as FormData; the backend reads "true"/"false" strings there.

const PAGE_SIZE = "20";

function listParams(cursor?: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ limit: PAGE_SIZE, ...extra });
  if (cursor) params.set("cursor", cursor);
  return params;
}

// ---------- Uploads ----------
export async function uploadImages(form: FormData) {
  return (await http.postForm<ApiData<string[]>>("/api/admin/uploads", form))
    .data;
}

// ---------- Products ----------
export function listProducts(cursor: string | undefined, q: string) {
  const params = listParams(cursor, q ? { q } : {});
  return http.get<Paginated<AdminProduct>>(`/api/admin/products?${params}`);
}

export async function getProduct(id: string) {
  return (
    await http.get<ApiData<AdminProductDetail>>(`/api/admin/products/${id}`)
  ).data;
}

export function createProduct(form: FormData) {
  return http.postForm("/api/admin/products", form);
}

export function updateProduct(id: string, form: FormData) {
  return http.patchForm(`/api/admin/products/${id}`, form);
}

export function hideProduct(id: string) {
  return http.delete(`/api/admin/products/${id}`);
}

export async function bulkCreateProducts(products: unknown[]) {
  const res = await http.post<ApiData<{ created: number; skipped: string[] }>>(
    "/api/admin/products/bulk",
    { products },
  );
  return res.data;
}

// ---------- Categories ----------
export async function listCategories() {
  return (await http.get<ApiData<AdminCategory[]>>("/api/admin/categories"))
    .data;
}

export function createCategory(form: FormData) {
  return http.postForm("/api/admin/categories", form);
}

export function updateCategory(id: string, form: FormData) {
  return http.patchForm(`/api/admin/categories/${id}`, form);
}

export function deleteCategory(id: string) {
  return http.delete(`/api/admin/categories/${id}`);
}

// ---------- Brands ----------
export async function listBrands() {
  return (await http.get<ApiData<AdminBrand[]>>("/api/admin/brands")).data;
}

export function createBrand(form: FormData) {
  return http.postForm("/api/admin/brands", form);
}

export function deleteBrand(id: string) {
  return http.delete(`/api/admin/brands/${id}`);
}

// ---------- Banners ----------
export async function listBanners() {
  return (await http.get<ApiData<AdminBanner[]>>("/api/admin/banners")).data;
}

export function createBanner(form: FormData) {
  return http.postForm("/api/admin/banners", form);
}

export function deleteBanner(id: string) {
  return http.delete(`/api/admin/banners/${id}`);
}

// ---------- Orders ----------
export function listOrders(cursor: string | undefined, status: string) {
  const params = listParams(cursor, status ? { status } : {});
  return http.get<Paginated<AdminOrder>>(`/api/admin/orders?${params}`);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return http.patch(`/api/admin/orders/${id}/status`, { status });
}

// Admin refunded from the Razorpay dashboard; this only records it.
export function markOrderRefunded(id: string) {
  return http.patch(`/api/admin/orders/${id}/refunded`);
}

// ---------- Reviews ----------
export function deleteReview(id: string) {
  return http.delete(`/api/admin/reviews/${id}`);
}

// ---------- Users ----------
export function listUsers(cursor: string | undefined, q: string) {
  const params = listParams(cursor, q ? { q } : {});
  return http.get<Paginated<AdminUser>>(`/api/admin/users?${params}`);
}

export function setUserBlocked(id: string, isBlocked: boolean) {
  return http.patch(`/api/admin/users/${id}/block`, { isBlocked });
}

export function setUserRole(
  id: string,
  role: Exclude<UserRole, "SUPER_ADMIN">,
) {
  return http.patch(`/api/admin/users/${id}/role`, { role });
}
