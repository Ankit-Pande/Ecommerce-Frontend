import { Suspense } from "react";
import { OrdersPage } from "@/features/orders/orders-page";
import { ListSkeleton } from "@/components/ui/skeletons";

// My orders page.
export default function OrdersRoute() {
  return (
    <Suspense
      fallback={
        <div className="py-8">
          <ListSkeleton />
        </div>
      }
    >
      <OrdersPage />
    </Suspense>
  );
}
