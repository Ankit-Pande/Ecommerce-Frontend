import { http } from "@/api/http";
import type { ApiData, Cart } from "@/lib/types";

// Every cart call returns the full, freshly priced cart.

export async function getCart() {
  return (await http.get<ApiData<Cart>>("/api/cart")).data;
}

export async function addToCart(productId: string, quantity: number) {
  const res = await http.post<ApiData<Cart>>("/api/cart", {
    productId,
    quantity,
  });
  return res.data;
}

export async function updateCartItem(productId: string, quantity: number) {
  const res = await http.patch<ApiData<Cart>>(`/api/cart/${productId}`, {
    quantity,
  });
  return res.data;
}

export async function removeCartItem(productId: string) {
  return (await http.delete<ApiData<Cart>>(`/api/cart/${productId}`)).data;
}
