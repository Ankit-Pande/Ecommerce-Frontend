import type { Metadata } from "next";
import { OrderDetailPage } from "@/features/orders/order-detail";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

// The /orders/:id page.
export default async function OrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OrderDetailPage id={(await params).id} />;
}
