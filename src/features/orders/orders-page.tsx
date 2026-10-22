"use client";

import { useCallback } from "react";
import Link from "next/link";
import { listOrders } from "@/api/order";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { OrderStatusPill, paymentText } from "@/features/orders/order-parts";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { tintFor } from "@/lib/colors";
import { formatDate, inr, orderNumber } from "@/lib/format";
import type { Order } from "@/lib/types";

// The user's orders, newest first, with "Load more".
export function OrdersPage() {
  const { ready } = useAuthGuard();
  // Loads one page of orders.
  const loadOrders = useCallback((cursor?: string) => listOrders(cursor), []);
  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<Order>(loadOrders, ready);

  let body: React.ReactNode;
  if (!ready || loading) {
    body = <ListSkeleton />;
  } else if (failed) {
    body = <OfflineNotice onRetry={reload} />;
  } else if (items.length === 0) {
    body = (
      <div className="card flex flex-col items-center gap-4 p-10">
        <p className="text-xl font-semibold">No orders yet</p>
        <Link href="/" className="btn-primary px-7">
          Continue shopping
        </Link>
      </div>
    );
  } else {
    body = (
      <>
        {items.map((order) => {
          const first = order.items[0];
          const count = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const href = `/orders/${order.id}`;
          return (
            <article
              key={order.id}
              className="card flex flex-wrap items-center gap-4 p-3.5"
            >
              <Link
                href={href}
                aria-label={`Order ${orderNumber(order.id)}`}
                className="shrink-0 rounded-2xl p-2.5"
                style={{ background: tintFor(order.id) }}
              >
                <span className="relative block h-[72px] w-[72px] sm:h-[88px] sm:w-[88px]">
                  <SafeImage src={first?.productImage} alt="" sizes="88px" />
                </span>
              </Link>
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="text-xl font-extrabold leading-snug">
                  {first?.productName}
                  {order.items.length > 1 &&
                    ` + ${order.items.length - 1} more`}
                </p>
                <p className="text-muted">
                  {count} {count === 1 ? "item" : "items"} ·{" "}
                  {orderNumber(order.id)} · {formatDate(order.createdAt)}
                </p>
                <p className="text-muted">{paymentText(order)}</p>
              </div>
              <OrderStatusPill status={order.status} />
              <p className="text-[22px] font-extrabold">
                {inr(order.totalPaise)}
              </p>
              <Link href={href} className="btn-outline">
                View details
              </Link>
            </article>
          );
        })}
        {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">My orders</h1>
      {body}
    </>
  );
}
