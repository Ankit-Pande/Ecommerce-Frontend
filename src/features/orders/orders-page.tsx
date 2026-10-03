"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Banknote,
  Check,
  Clock3,
  CreditCard,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { errorMessage } from "@/api/http";
import { cancelOrder, listOrders, retryPayment } from "@/api/order";
import { Button } from "@/components/ui/button";
import { openRazorpay, RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { formatDate, formatTime, inr } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { toast } from "@/store/toast-store";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { SafeImage } from "@/components/ui/safe-image";
import type { Order, OrderStatus } from "@/lib/types";

// Only an unshipped, unpaid order can be cancelled.
function canCancel(order: Order) {
  return (
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    order.paymentStatus === "PENDING"
  );
}

// An unpaid online order can be paid until its deadline.
function canPay(order: Order) {
  return (
    order.paymentMethod === "ONLINE" &&
    order.status === "PENDING" &&
    order.paymentStatus === "PENDING" &&
    order.paymentExpiresAt !== null &&
    new Date(order.paymentExpiresAt).getTime() > Date.now()
  );
}

const STATUS: Record<
  OrderStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  PENDING: {
    label: "Payment pending",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    icon: PackageCheck,
  },
  SHIPPED: {
    label: "Shipped",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-300",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    icon: Check,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    icon: XCircle,
  },
};

const CONFIRM_WAIT_MS = 5000;

const TRACK_STEPS: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED"];

const PAYMENT_LABEL = {
  PENDING: "Not paid yet",
  COMPLETED: "Paid",
  REFUNDED: "Refunded",
} as const;

// My orders with cancel and pay again.
export function OrdersPage() {
  const { ready } = useAuthGuard();
  const [cancellingId, setCancellingId] = useState("");
  const [payingId, setPayingId] = useState("");

  const {
    items: orders,
    setItems: setOrders,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<Order>(listOrders, ready);

  // Cancels an order.
  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this order? This action cannot be undone."))
      return;
    setCancellingId(id);
    try {
      const response = await cancelOrder(id);
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status: "CANCELLED" } : order,
        ),
      );
      toast.success(response.message);
    } catch (error) {
      toast.error(errorMessage(error, "Could not cancel this order"));
    } finally {
      setCancellingId("");
    }
  }

  // Opens Razorpay again for an unpaid order.
  async function handlePay(id: string) {
    setPayingId(id);
    try {
      const payment = await retryPayment(id);
      const opened = openRazorpay(payment, {
        onPaid: () => {
          toast.success(
            "Payment received. Your order will be confirmed shortly.",
          );
          setTimeout(reload, CONFIRM_WAIT_MS);
        },
        onClose: () => toast.error("Payment was not completed."),
      });
      if (!opened) toast.error("The payment window could not open. Try again.");
    } catch (error) {
      toast.error(errorMessage(error, "Could not start the payment"));
    } finally {
      setPayingId("");
    }
  }

  if (!ready || loading) {
    return (
      <OrdersShell>
        <ListSkeleton />
      </OrdersShell>
    );
  }

  if (failed) {
    return (
      <OrdersShell>
        <OfflineNotice onRetry={reload} />
      </OrdersShell>
    );
  }

  return (
    <OrdersShell>
      <Script
        src={RAZORPAY_SCRIPT}
        strategy="lazyOnload"
        onError={() => toast.error("Secure payment service could not load")}
      />
      {orders.length === 0 ? (
        <div className="card py-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mist text-accent dark:bg-white/[0.06]">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">No orders yet</h2>
          <Link href="/products" className="btn-primary mt-5">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              cancelling={cancellingId === order.id}
              paying={payingId === order.id}
              onCancel={() => handleCancel(order.id)}
              onPay={() => handlePay(order.id)}
            />
          ))}
          {cursor && (
            <div className="pt-2">
              <LoadMoreButton onClick={loadMore} loading={loadingMore} />
            </div>
          )}
        </div>
      )}
    </OrdersShell>
  );
}

// Page title around the orders list.
function OrdersShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl pb-12 pt-6 sm:pt-8">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-accent/10 via-violet-100/60 to-orange-100/70 p-5 dark:from-white/5 dark:via-white/5 dark:to-white/5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-deal">
          Account
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          My orders
        </h1>
      </div>
      {children}
    </div>
  );
}

// One order with items, status and actions.
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
  const status = STATUS[order.status];
  const StatusIcon = status.icon;
  const PaymentIcon = order.paymentMethod === "COD" ? Banknote : CreditCard;
  const orderLabel = order.id.slice(0, 8).toUpperCase();

  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sand px-4 py-3.5 dark:border-white/10 sm:px-5">
        <div>
          <p className="text-[11px] font-semibold text-gray-400">Order ID</p>
          <p className="font-display text-base font-extrabold">#{orderLabel}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400">Placed on</p>
          <p className="text-sm font-bold">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`status-pill ml-auto gap-1.5 ${status.className}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {status.label}
        </span>
      </header>

      <div className="p-4 sm:p-5">
        {TRACK_STEPS.includes(order.status) && (
          <OrderTracker status={order.status} />
        )}

        <ul className="space-y-3">
          {order.items.map((item, index) => (
            <li
              key={`${item.productName}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-mist/60 p-2.5 dark:bg-white/[0.04]"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-white/10">
                <SafeImage
                  src={item.productImage}
                  alt=""
                  sizes="56px"
                  className="object-contain p-1"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-semibold">
                  {item.productName}
                </span>
                <span className="text-xs text-gray-500">
                  Qty {item.quantity} · {inr(item.pricePaise)} each
                </span>
              </span>
              <span className="shrink-0 text-sm font-extrabold">
                {inr(item.pricePaise * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-black/15 pt-4 dark:border-white/15">
          <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
            <PaymentIcon className="h-4 w-4" />
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"}
            {" · "}
            {PAYMENT_LABEL[order.paymentStatus]}
          </span>
          <span className="ml-auto font-display text-xl font-extrabold">
            {inr(order.totalPaise)}
          </span>
          {canPay(order) && (
            <>
              <span className="w-full text-right text-xs font-bold text-amber-700 dark:text-amber-300 sm:w-auto">
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
      </div>
    </article>
  );
}

// Confirmed → shipped → delivered progress line.
function OrderTracker({ status }: { status: OrderStatus }) {
  const reached = TRACK_STEPS.indexOf(status);
  const labels = ["Confirmed", "Shipped", "Delivered"];

  return (
    <ol className="mb-5 flex items-center" aria-label="Order progress">
      {labels.map((label, index) => (
        <li
          key={label}
          className={`flex items-center ${index < labels.length - 1 ? "flex-1" : ""}`}
        >
          <span className="flex flex-col items-center gap-1">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full ${index <= reached ? "bg-leaf text-white" : "bg-gray-200 text-gray-400 dark:bg-white/10"}`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <span
              className={`text-[11px] font-bold ${index <= reached ? "text-leaf" : "text-gray-400"}`}
            >
              {label}
            </span>
          </span>
          {index < labels.length - 1 && (
            <span
              className={`mx-2 mb-5 h-1 flex-1 rounded-full ${index < reached ? "bg-leaf" : "bg-gray-200 dark:bg-white/10"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
