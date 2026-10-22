import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/ui/skeletons";
import { OrderPlaced } from "@/features/checkout/order-placed";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

// The /order-placed?id=… page.
export default function OrderPlacedRoute() {
  return (
    <Suspense fallback={<ListSkeleton count={2} />}>
      <OrderPlaced />
    </Suspense>
  );
}
