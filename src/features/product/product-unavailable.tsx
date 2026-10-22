"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { OfflineNotice } from "@/components/ui/offline-notice";

// Shown when the product page could not load; retry loads it from the server again.
export function ProductUnavailable() {
  const router = useRouter();
  const [, startRefresh] = useTransition();

  return <OfflineNotice onRetry={() => startRefresh(() => router.refresh())} />;
}
