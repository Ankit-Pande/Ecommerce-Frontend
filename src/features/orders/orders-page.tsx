"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ChevronRight, Package } from "lucide-react";
import { listOrders } from "@/api/order";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { formatDate, formatTime, inr } from "@/lib/format";
import {
  canCancel,
  canPay,
  OrderTracker,
  StatusPill,
  useOrderActions,
} from "@/features/orders/order-parts";
import type { Order } from "@/lib/types";

// My orders: active orders by default, cancelled ones in their own tab.
export function OrdersPage() {
  const { ready } = useAuthGuard();
  const [showCancelled, setShowCancelled] = useState(false);
  const loadOrders = useCallback(
    (cursor?: string) => listOrders(showCancelled, cursor),
    [showCancelled],
  );
  const {
    items: orders,
    setItems: setOrders,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<Order>(loadOrders, ready);

  const actions = useOrderActions({
    onCancelled: (id) =>
      setOrders((current) => current.filter((order) => order.id !== id)),
    onPaid: reload,
  });

  return (
    <div className="mx-auto max-w-4xl pb-12 pt-6 sm:pt-8">
      <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-gradient-to-r from-accent/10 via-violet-100/60 to-orange-100/70 p-5 dark:from-white/5 dark:via-white/5 dark:to-white/5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-deal">
            Account
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
            My orders
          </h1>
        </div>
        <div
          role="tablist"
          aria-label="Order type"
          className="flex rounded-full bg-white p-1 shadow-card dark:bg-white/10"
        >
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
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${showCancelled === tab.value ? "bg-accent text-white" : "text-gray-500 hover:text-ink"}`}
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
      ) : orders.length === 0 ? (
        <div className="card py-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mist text-accent dark:bg-white/[0.06]">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">
            {showCancelled ? "No cancelled orders" : "No orders yet"}
          </h2>
          {!showCancelled && (
            <Link href="/products" className="btn-primary mt-5">
              Start shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              cancelling={actions.cancellingId === order.id}
              paying={actions.payingId === order.id}
              onCancel={() => actions.cancel(order.id)}
              onPay={() => actions.pay(order.id)}
            />
          ))}
          {cursor && (
            <div className="pt-2">
              <LoadMoreButton onClick={loadMore} loading={loadingMore} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One order: photos, status and actions; the body opens the order page.
function OrderCard({
  order,
  cancelling,
  paying,
  onCancel,
  onPay,
}: {
  order: Order;
  cancelling: boolean;
  paying: boolean;
  onCancel: () => void;
  onPay: () => void;
}) {
  const href = `/orders/${order.id}`;

  return (
    <article className="card overflow-hidden transition hover:shadow-soft">
      <Link
        href={href}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sand px-4 py-3.5 dark:border-white/10 sm:px-5"
      >
        <div>
          <p className="text-[11px] font-semibold text-gray-400">Order ID</p>
          <p className="font-display text-base font-extrabold">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400">Placed on</p>
          <p className="text-sm font-bold">{formatDate(order.createdAt)}</p>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <StatusPill status={order.status} />
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </span>
      </Link>

      <div className="p-4 sm:p-5">
        <OrderTracker status={order.status} />
        <Link href={href} className="flex items-center gap-3">
          <span className="flex -space-x-3">
            {order.items.slice(0, 3).map((item, index) => (
              <span
                key={`${item.productName}-${index}`}
                className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-mist dark:border-night"
              >
                <SafeImage
                  src={item.productImage}
                  alt=""
                  sizes="56px"
                  className="object-contain p-1"
                />
              </span>
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 text-sm font-semibold">
              {order.items[0]?.productName}
            </span>
            <span className="text-xs text-gray-500">
              {order.items.length > 1
                ? `+${order.items.length - 1} more item${order.items.length > 2 ? "s" : ""}`
                : `Qty ${order.items[0]?.quantity ?? 0}`}
            </span>
          </span>
          <span className="font-display text-lg font-extrabold">
            {inr(order.totalPaise)}
          </span>
        </Link>

        {(canPay(order) || canCancel(order)) && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-dashed border-black/15 pt-4 dark:border-white/15">
            {canPay(order) && (
              <>
                <span className="text-xs font-bold text-amber-700">
                  Pay by {formatTime(order.paymentExpiresAt!)}
                </span>
                <Button onClick={onPay} loading={paying} className="px-4">
                  Pay now
                </Button>
              </>
            )}
            {canCancel(order) && (
              <Button variant="danger" onClick={onCancel} loading={cancelling}>
                Cancel order
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
