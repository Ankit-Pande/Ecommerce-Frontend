import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccess } from "@/features/orders/order-success";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

// Order result page; Suspense is needed because it reads the URL.
export default function OrderSuccessRoute() {
  return (
    <Suspense>
      <OrderSuccess />
    </Suspense>
  );
}
