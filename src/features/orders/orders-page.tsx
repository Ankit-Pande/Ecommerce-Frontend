"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { listOrders } from "@/api/order";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { formatDate, formatTime, inr, tintFor } from "@/lib/format";
import {
  canPay,
  OrderStatusPill,
  paymentText,
  useOrderActions,
} from "@/features/orders/order-parts";
import type { Order } from "@/lib/types";

// My orders: active orders by default, cancelled ones under their own chip.
export function OrdersPage() {
  const { ready } = useAuthGuard();
  const [showCancelled, setShowCancelled] = useState(false);
  const loadOrders = useCallback(
    (cursor?: string) => listOrders(showCancelled, cursor),
    [showCancelled],
  );
  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<Order>(loadOrders, ready);
  const actions = useOrderActions({ onCancelled: reload, onPaid: reload });

  return (
    <div className="flex flex-col gap-7">
      <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-extrabold">My orders</h1>
        <div className="flex gap-1.5" role="tablist" aria-label="Order type">
          {[
            { value: false, label: "Orders" },
            { value: true, label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={showCancelled === tab.value}
              onClick={() => setShowCancelled(tab.value)}
              className="chip"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!ready || loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10">
          <p className="text-xl font-semibold">
            {showCancelled ? "No cancelled orders" : "No orders yet"}
          </p>
          {!showCancelled && (
            <Link href="/" className="btn-primary min-h-12 px-7">
              Continue shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((order) => {
            const first = order.items[0];
            const count = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <article
                key={order.id}
                className="card flex flex-wrap items-center gap-4 p-3.5"
              >
                <span
                  className="rounded-[14px] p-2"
                  style={{ background: tintFor(order.id) }}
                >
                  <span className="relative block h-[72px] w-[72px]">
                    <SafeImage
                      src={first?.productImage}
                      alt=""
                      sizes="72px"
                      className="object-contain"
                    />
                  </span>
                </span>
                <div className="flex-[1_1_200px]">
                  <p className="text-lg font-extrabold">
                    {first?.productName}
                    {order.items.length > 1 &&
                      ` + ${order.items.length - 1} more`}
                  </p>
                  <p className="text-muted">
                    {count} {count === 1 ? "item" : "items"} · #
                    {order.id.slice(0, 8).toUpperCase()} ·{" "}
                    {formatDate(order.createdAt)} · {paymentText(order)}
                  </p>
                  {canPay(order) && (
                    <p className="font-semibold text-[#5C4300]">
                      Pay by {formatTime(order.paymentExpiresAt!)}
                    </p>
                  )}
                </div>
                <OrderStatusPill status={order.status} />
                <p className="text-xl font-extrabold">
                  {inr(order.totalPaise)}
                </p>
                {canPay(order) && (
                  <Button
                    onClick={() => actions.pay(order.id)}
                    loading={actions.payingId === order.id}
                  >
                    Pay now
                  </Button>
                )}
                <Link href={`/orders/${order.id}`} className="btn-outline">
                  View details
                </Link>
              </article>
            );
          })}
          {cursor && (
            <LoadMoreButton onClick={loadMore} loading={loadingMore} />
          )}
        </div>
      )}
    </div>
  );
}
