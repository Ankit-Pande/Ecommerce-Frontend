import { http } from "@/api/http";
import type { ApiData, Cart } from "@/lib/types";

// Cart with live prices.
export async function getCart() {
  return (await http.get<ApiData<Cart>>("/api/cart")).data;
}

// Adds a product to the cart.
export async function addToCart(productId: string, quantity: number) {
  const res = await http.post<ApiData<Cart>>("/api/cart", {
    productId,
    quantity,
  });
  return res.data;
}

// Changes the quantity of a cart item.
export async function updateCartItem(productId: string, quantity: number) {
  const res = await http.patch<ApiData<Cart>>(`/api/cart/${productId}`, {
    quantity,
  });
  return res.data;
}

// Removes a product from the cart.
export async function removeCartItem(productId: string) {
  return (await http.delete<ApiData<Cart>>(`/api/cart/${productId}`)).data;
}
