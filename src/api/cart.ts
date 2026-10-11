import { http } from "@/api/http";
import type { ApiData, Cart, Options } from "@/lib/types";

// Cart with live prices.
export async function getCart() {
  return (await http.get<ApiData<Cart>>("/api/cart")).data;
}

// Adds a product (with the chosen size and colour) to the cart.
export async function addToCart(
  productId: string,
  quantity: number,
  options?: Partial<Options>,
) {
  const res = await http.post<ApiData<Cart>>("/api/cart", {
    productId,
    quantity,
    ...options,
  });
  return res.data;
}

// Changes the quantity of one cart line.
export async function updateCartItem(itemId: string, quantity: number) {
  const res = await http.patch<ApiData<Cart>>(`/api/cart/${itemId}`, {
    quantity,
  });
  return res.data;
}

// Removes one cart line.
export async function removeCartItem(itemId: string) {
  return (await http.delete<ApiData<Cart>>(`/api/cart/${itemId}`)).data;
}
