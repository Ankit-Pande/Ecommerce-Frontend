import type { Metadata } from "next";
import { OrderDetailPage } from "@/features/orders/order-detail";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

// One order with items, address and payment.
export default function OrderDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  return <OrderDetailPage id={params.id} />;
}
