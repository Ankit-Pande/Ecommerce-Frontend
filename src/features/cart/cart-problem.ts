import type { CartItem } from "@/lib/types";

// Why a cart line cannot be ordered ("No longer available", "Only 2 available"), or "".
export function cartProblem({ product, quantity }: CartItem) {
  if (!product.isAvailable) return "No longer available";
  if (quantity <= product.maxQuantity) return "";
  return product.maxQuantity === 0
    ? "Out of stock"
    : `Only ${product.maxQuantity} available`;
}
