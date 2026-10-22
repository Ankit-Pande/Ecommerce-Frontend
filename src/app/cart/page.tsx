import type { Metadata } from "next";
import { CartPage } from "@/features/cart/cart-page";

export const metadata: Metadata = { title: "Cart" };

// The /cart page.
export default function CartRoute() {
  return <CartPage />;
}
