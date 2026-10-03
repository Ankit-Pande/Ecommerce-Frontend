"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OfflineNotice } from "@/components/ui/offline-notice";

// Shown when the product API does not answer.
export function ProductUnavailable() {
  const router = useRouter();
  const [, startChecking] = useTransition();

  return (
    <div className="pb-10 pt-6 text-center">
      <OfflineNotice onRetry={() => startChecking(() => router.refresh())} />
      <Link href="/products" className="btn-ghost mt-3">
        Back to products
      </Link>
    </div>
  );
}
