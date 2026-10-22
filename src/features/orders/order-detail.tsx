"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { errorMessage } from "@/api/http";
import { getCart } from "@/api/cart";
import { cancelOrder, getOrder } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import {
  CANCELLED_BY_TEXT,
  canCancel,
  canPay,
  OrderStatusPill,
  paymentText,
  usePayAgain,
} from "@/features/orders/order-parts";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { tintFor } from "@/lib/colors";
import {
  formatDate,
  formatTime,
  inr,
  optionText,
  orderNumber,
  phoneText,
  shippingAddress,
} from "@/lib/format";
import { buyNowHref } from "@/lib/links";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { SUPPORT_PHONE } from "@/lib/site";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { OrderDetail, OrderStatus } from "@/lib/types";

const TRACK_STEPS: { label: string; reachedAt: OrderStatus[] }[] = [
  {
    label: "Order placed",
    reachedAt: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
  },
  {
    label: "Order confirmed",
    reachedAt: ["CONFIRMED", "SHIPPED", "DELIVERED"],
  },
  { label: "Shipped", reachedAt: ["SHIPPED", "DELIVERED"] },
  { label: "Delivered", reachedAt: ["DELIVERED"] },
];

// One order: status, items, address, payment, and pay again or cancel.
export function OrderDetailPage({ id }: { id: string }) {
  const { ready } = useAuthGuard();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Loads the order.
  const loadOrder = useCallback(() => {
    setFailed(false);
    getOrder(id)
      .then(setOrder)
      .catch(() => setFailed(true));
  }, [id]);

  const { paying, pay } = usePayAgain(loadOrder);

  useEffect(() => {
    if (ready) loadOrder();
  }, [ready, loadOrder]);

  // Cancels the order after a confirm (an unpaid online order goes back to the cart).
  async function cancel() {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    const backToCart =
      order?.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING";
    try {
      await cancelOrder(id);
      toast.success(
        backToCart
          ? "Order cancelled. Its items are back in your cart."
          : "Order cancelled",
      );
      if (backToCart) {
        getCart()
          .then(useCartStore.getState().updateCount)
          .catch(() => undefined);
      }
      loadOrder();
    } catch (error) {
      toast.error(errorMessage(error, "Could not cancel this order"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/orders" className="btn-line">
          ‹ My orders
        </Link>
        <h1 className="page-title">Order {orderNumber(id)}</h1>
        {order && <OrderStatusPill status={order.status} />}
      </div>

      {failed ? (
        <OfflineNotice onRetry={loadOrder} />
      ) : !order ? (
        <ListSkeleton count={2} />
      ) : (
        <>
          {canPay(order) && (
            <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-sunny-light p-4">
              <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
              <p className="flex-[1_1_220px]">
                <span className="block text-lg font-extrabold">
                  Payment of {inr(order.totalPaise)} is pending
                </span>
                {order.paymentExpiresAt && (
                  <span>
                    Pay by {formatTime(order.paymentExpiresAt)} or the order is
                    cancelled.
                  </span>
                )}
              </p>
              <Button onClick={() => pay(order.id)} loading={paying}>
                Pay now
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <section className="card flex flex-[1_1_280px] flex-col p-5">
              <h2 className="pb-2 text-[22px] font-extrabold">
                Delivery status
              </h2>
              <ol aria-label="Delivery status">
                {TRACK_STEPS.map((step) => {
                  const done = step.reachedAt.includes(order.status);
                  return (
                    <li
                      key={step.label}
                      className={`relative ml-2.5 flex min-h-14 items-center gap-3.5 border-l-[3px] pl-[18px] ${done ? "border-accent" : "border-line"}`}
                    >
                      <span
                        className={`absolute -left-[11px] h-[19px] w-[19px] rounded-full border-[3px] ${done ? "border-accent bg-accent" : "border-line bg-white"}`}
                      />
                      <span className="flex-1 font-semibold">{step.label}</span>
                      <span className="text-muted">
                        {done
                          ? "Done"
                          : order.status === "CANCELLED"
                            ? "Cancelled"
                            : "Pending"}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {order.status === "CANCELLED" && order.cancelledBy && (
                <p className="mt-3 font-semibold text-danger">
                  {CANCELLED_BY_TEXT[order.cancelledBy]}
                </p>
              )}
              {order.needsReview && (
                <p className="mt-3 font-semibold">
                  We are checking a payment on this order. Any extra or late
                  payment will be refunded.
                </p>
              )}
              {order.status === "CONFIRMED" &&
                order.paymentStatus === "COMPLETED" && (
                  <p className="mt-3 text-muted">
                    To cancel a paid order, call customer care at +91{" "}
                    {SUPPORT_PHONE}.
                  </p>
                )}
              {canCancel(order) && (
                <Button
                  variant="danger"
                  onClick={cancel}
                  loading={cancelling}
                  className="mt-3"
                >
                  Cancel order
                </Button>
              )}
            </section>

            <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
              <div className="card flex flex-col gap-2.5 p-4">
                <h2 className="text-lg font-extrabold">
                  Items in this order · {formatDate(order.createdAt)}
                </h2>
                {order.items.map((item, index) => {
                  const href = `/products/${item.product.slug}`;
                  return (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-3"
                    >
                      <Link
                        href={href}
                        aria-label={item.productName}
                        className="shrink-0 rounded-[14px] p-2"
                        style={{ background: tintFor(item.productId) }}
                      >
                        <span className="relative block h-16 w-16 sm:h-20 sm:w-20">
                          <SafeImage
                            src={item.productImage}
                            alt=""
                            sizes="80px"
                          />
                        </span>
                      </Link>
                      <Link
                        href={href}
                        className="flex min-h-11 min-w-0 flex-[1_1_160px] flex-col justify-center text-lg font-semibold"
                      >
                        {item.productName} × {item.quantity}
                        {optionText(item) && (
                          <span className="text-base text-muted">
                            {optionText(item)}
                          </span>
                        )}
                      </Link>
                      <span className="font-extrabold">
                        {inr(item.pricePaise * item.quantity)}
                      </span>
                      <Link
                        href={buyNowHref(item.product.slug, {
                          size: item.size ?? "",
                          color: item.color ?? "",
                        })}
                        className="btn-grey px-3.5"
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

              <div className="card grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-5">
                <div>
                  <h2 className="font-extrabold">Delivery address</h2>
                  <p>{order.shipName}</p>
                  <p>{shippingAddress(order)}</p>
                  <p>{phoneText(order.shipPhone)}</p>
                </div>
                <div>
                  <h2 className="font-extrabold">Payment</h2>
                  <p>{paymentText(order)}</p>
                  <p>Total {inr(order.totalPaise)}</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
