import { Suspense } from "react";
import { CheckoutPage } from "@/features/checkout/checkout-page";
import { ListSkeleton } from "@/components/ui/skeletons";

// The page reads ?buy= from the URL, so it needs a Suspense boundary.
export default function CheckoutRoute() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CheckoutPage />
    </Suspense>
  );
}
