import { http } from "@/api/http";
import type { ApiData, Cart, Options } from "@/lib/types";

// The cart with live prices and stock.
export async function getCart() {
  return (await http.get<ApiData<Cart>>("/api/cart")).data;
}

// Adds a product (with size and colour) and returns the new cart.
export async function addToCart(
  productId: string,
  quantity: number,
  options: Partial<Options> = {},
) {
  const body = {
    productId,
    quantity,
    ...(options.size && { size: options.size }),
    ...(options.color && { color: options.color }),
  };
  return (await http.post<ApiData<Cart>>("/api/cart", body)).data;
}

// Changes a line's quantity and returns the new cart.
export async function updateCartItem(itemId: string, quantity: number) {
  return (
    await http.patch<ApiData<Cart>>(`/api/cart/${encodeURIComponent(itemId)}`, {
      quantity,
    })
  ).data;
}

// Removes a line and returns the new cart.
export async function removeCartItem(itemId: string) {
  return (
    await http.delete<ApiData<Cart>>(`/api/cart/${encodeURIComponent(itemId)}`)
  ).data;
}
