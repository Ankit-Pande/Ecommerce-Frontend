"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { getOrder } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatDate, inr, tintFor } from "@/lib/format";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import {
  CANCELLED_BY_TEXT,
  canCancel,
  canPay,
  OrderStatusPill,
  OrderTimeline,
  paymentText,
  useOrderActions,
} from "@/features/orders/order-parts";
import type { OrderDetail } from "@/lib/types";

// Order page: delivery status, items with Buy again, address and payment.
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
    <div className="flex flex-col gap-7">
      <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/orders" className="btn-line">
          ‹ My orders
        </Link>
        <h1 className="text-[32px] font-extrabold">
          Order #{id.slice(0, 8).toUpperCase()}
        </h1>
        {order && <OrderStatusPill status={order.status} />}
      </div>

      {failed ? (
        <OfflineNotice onRetry={reload} />
      ) : !order ? (
        <ListSkeleton />
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <section className="card flex flex-[1_1_280px] flex-col rounded-3xl p-5">
            <h2 className="pb-2 text-[22px] font-extrabold">Delivery status</h2>
            <OrderTimeline status={order.status} />
            {order.status === "CANCELLED" && order.cancelledBy && (
              <p className="mt-3 font-semibold text-danger">
                {CANCELLED_BY_TEXT[order.cancelledBy]}
              </p>
            )}
            {canPay(order) && (
              <Button
                onClick={() => actions.pay(order.id)}
                loading={actions.payingId === order.id}
                className="mt-3 min-h-12"
              >
                Pay {inr(order.totalPaise)} now
              </Button>
            )}
            {canCancel(order) && (
              <Button
                variant="outline"
                onClick={() => actions.cancel(order.id)}
                loading={actions.cancellingId === order.id}
                className="mt-3 min-h-12 border-danger text-danger"
              >
                Cancel order
              </Button>
            )}
          </section>

          <section className="flex flex-[1_1_320px] flex-col gap-4">
            <div className="card flex flex-col gap-2.5 rounded-3xl p-4">
              <h2 className="text-lg font-extrabold">
                Items in this order · {formatDate(order.createdAt)}
              </h2>
              {order.items.map((item) => {
                const href = `/products/${item.product.slug}`;
                return (
                  <div
                    key={item.productId}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <Link
                      href={href}
                      aria-label={item.productName}
                      className="rounded-xl p-1.5"
                      style={{ background: tintFor(item.productId) }}
                    >
                      <span className="relative block h-16 w-16">
                        <SafeImage
                          src={item.productImage}
                          alt=""
                          sizes="64px"
                          className="object-contain"
                        />
                      </span>
                    </Link>
                    <Link
                      href={href}
                      className="flex min-h-11 flex-[1_1_160px] items-center font-semibold"
                    >
                      {item.productName} × {item.quantity}
                    </Link>
                    <span className="font-extrabold">
                      {inr(item.pricePaise * item.quantity)}
                    </span>
                    <Link
                      href={`/checkout?buy=${encodeURIComponent(item.product.slug)}`}
                      className="btn-grey"
                    >
                      Buy again
                    </Link>
                  </div>
                );
              })}
              <p className="flex justify-between border-t border-line pt-2">
                <span>Subtotal</span>
                <span>{inr(order.totalPaise)}</span>
              </p>
              <p className="flex justify-between">
                <span>Delivery</span>
                <span>Free</span>
              </p>
              <p className="flex justify-between text-lg font-extrabold">
                <span>Total</span>
                <span>{inr(order.totalPaise)}</span>
              </p>
            </div>

            <div className="card grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 rounded-3xl p-5">
              <div>
                <h2 className="font-extrabold">Delivery address</h2>
                <p>{order.shipName}</p>
                <p>
                  {[
                    order.shipLine1,
                    order.shipLine2,
                    order.shipCity,
                    order.shipState,
                  ]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  {order.shipPincode}
                </p>
                <p>+91 {order.shipPhone}</p>
              </div>
              <div>
                <h2 className="font-extrabold">Payment</h2>
                <p>{paymentText(order)}</p>
                <p>Total {inr(order.totalPaise)}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
