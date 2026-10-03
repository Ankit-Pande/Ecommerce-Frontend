import { Suspense } from "react";
import { CheckoutPage } from "@/features/checkout/checkout-page";
import { ListSkeleton } from "@/components/ui/skeletons";

// Checkout page; Suspense is needed because it reads ?buy= from the URL.
export default function CheckoutRoute() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CheckoutPage />
    </Suspense>
  );
}
