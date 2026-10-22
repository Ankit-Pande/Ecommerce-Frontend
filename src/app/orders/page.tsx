import type { Metadata } from "next";
import { OrdersPage } from "@/features/orders/orders-page";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

// The /orders page.
export default function OrdersRoute() {
  return <OrdersPage />;
}
