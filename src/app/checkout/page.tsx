import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/ui/skeletons";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

// /checkout (reads the URL, so it sits inside Suspense).
export default function CheckoutRoute() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CheckoutPage />
    </Suspense>
  );
}
