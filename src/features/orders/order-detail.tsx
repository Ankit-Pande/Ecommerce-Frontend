"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, CreditCard, MapPin, XCircle } from "lucide-react";
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
} from "./order-parts";
import type { OrderDetail } from "@/lib/types";

// Order page: product photos, progress, who cancelled, address and payment.
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
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                <XCircle className="h-4 w-4 shrink-0" />
                {CANCELLED_BY_TEXT[order.cancelledBy]}
              </p>
            )}

            <div className="mt-5">
              <OrderTracker status={order.status} />
            </div>

            <ul className="space-y-3">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productName}-${index}`}
                  className="flex items-center gap-4 rounded-2xl bg-mist/60 p-3 dark:bg-white/[0.04]"
                >
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white dark:bg-white/10">
                    <SafeImage
                      src={item.productImage}
                      alt={item.productName}
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-bold">
                      {item.productName}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Qty {item.quantity} × {inr(item.pricePaise)}
                    </span>
                  </span>
                  <span className="font-extrabold">
                    {inr(item.pricePaise * item.quantity)}
                  </span>
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
                <div className="flex justify-between">
                  <dt className="text-gray-500">Delivery</dt>
                  <dd className="font-bold text-leaf">Free</dd>
                </div>
                <div className="flex justify-between border-t border-sand pt-2 dark:border-white/10">
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
