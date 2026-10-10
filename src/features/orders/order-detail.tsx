"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, CreditCard, MapPin, Truck, XCircle } from "lucide-react";
import { getOrder } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatDate, formatTime, inr } from "@/lib/format";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import {
  CANCELLED_BY_TEXT,
  canCancel,
  canPay,
  OrderTracker,
  PAYMENT_LABEL,
  StatusPill,
  useOrderActions,
} from "@/features/orders/order-parts";
import type { OrderDetail } from "@/lib/types";

const DELIVERY_DAYS = 5;

// One line about where the order is now and when it will arrive.
function deliveryText(order: OrderDetail) {
  const expected = new Date(order.createdAt);
  expected.setDate(expected.getDate() + DELIVERY_DAYS);
  const by = expected.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (order.status === "PENDING")
    return `Waiting for payment. Delivery by ${by} after payment.`;
  if (order.status === "CONFIRMED")
    return `Order confirmed and being packed. Delivery by ${by}.`;
  if (order.status === "SHIPPED")
    return `On the way to you. Delivery by ${by}.`;
  if (order.status === "DELIVERED")
    return `Delivered on ${formatDate(order.updatedAt)}.`;
  return "This order was cancelled.";
}

// Order page: where it is, delivery date, product photos, address and payment.
export function OrderDetailPage({ id }: { id: string }) {
  const { ready } = useAuthGuard();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);
  const actions = useOrderActions({ onCancelled: reload, onPaid: reload });

  useEffect(() => {
    if (!ready) return;
    setFailed(false);
    getOrder(id)
      .then(setOrder)
      .catch(() => setFailed(true));
  }, [ready, id, reloadKey]);

  return (
    <div className="mx-auto max-w-4xl pb-12 pt-6 sm:pt-8">
      <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      {failed ? (
        <OfflineNotice onRetry={reload} />
      ) : !order ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-4">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-400">Order ID</p>
                <h1 className="font-display text-2xl font-extrabold">
                  #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on {formatDate(order.createdAt)},{" "}
                  {formatTime(order.createdAt)}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>

            {order.status === "CANCELLED" && order.cancelledBy && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <XCircle className="h-4 w-4 shrink-0" />
                {CANCELLED_BY_TEXT[order.cancelledBy]}
              </p>
            )}

            {order.status !== "CANCELLED" && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                <Truck className="h-4 w-4 shrink-0" />
                {deliveryText(order)}
              </p>
            )}

            <div className="mt-5">
              <OrderTracker status={order.status} />
            </div>

            <ul className="space-y-3">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex items-start gap-4 rounded-2xl bg-ground/60 p-3"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white sm:h-36 sm:w-36"
                  >
                    <SafeImage
                      src={item.productImage}
                      alt={item.productName}
                      sizes="144px"
                      className="object-contain p-2"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="line-clamp-2 text-sm font-bold hover:text-accent"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                      {item.product.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Qty {item.quantity} × {inr(item.pricePaise)}
                    </p>
                    <p className="mt-1 font-extrabold">
                      {inr(item.pricePaise * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <MapPin className="h-4 w-4 text-accent" /> Delivery address
              </h2>
              <p className="mt-3 text-sm font-bold">{order.shipName}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {order.shipLine1}
                {order.shipLine2 && `, ${order.shipLine2}`}, {order.shipCity},{" "}
                {order.shipState} {order.shipPincode}
                <br />
                +91 {order.shipPhone}
              </p>
            </section>

            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <CreditCard className="h-4 w-4 text-accent" /> Payment
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Method</dt>
                  <dd className="font-bold">
                    {order.paymentMethod === "COD"
                      ? "Cash on delivery"
                      : "Online"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-bold">
                    {PAYMENT_LABEL[order.paymentStatus]}
                  </dd>
                </div>
                {order.paymentMethod === "COD" &&
                  order.paymentStatus === "PENDING" &&
                  order.status !== "CANCELLED" && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      Pay {inr(order.totalPaise)} in cash when the order
                      arrives.
                    </p>
                  )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd className="font-bold text-accent">Free</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-display text-lg font-extrabold">
                    {inr(order.totalPaise)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {(canPay(order) || canCancel(order)) && (
            <div className="flex flex-wrap justify-end gap-3">
              {canPay(order) && (
                <Button
                  onClick={() => actions.pay(order.id)}
                  loading={actions.payingId === order.id}
                >
                  Pay {inr(order.totalPaise)} now
                </Button>
              )}
              {canCancel(order) && (
                <Button
                  variant="danger"
                  onClick={() => actions.cancel(order.id)}
                  loading={actions.cancellingId === order.id}
                >
                  Cancel order
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
