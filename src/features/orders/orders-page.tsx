"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  Banknote,
  AlertTriangle,
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
import type { Order, OrderStatus } from "@/lib/types";

// Backend rules: only an unshipped order without a payment can be cancelled
// (refunds are manual), and an unpaid online order can be paid until its deadline.
function canCancel(order: Order) {
  return (
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    order.paymentStatus === "PENDING"
  );
}

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

// The webhook confirms a paid order a few seconds after the popup closes.
const CONFIRM_WAIT_MS = 5000;

type PlacedResult = "cod" | "paid" | "pending";

const PLACED_BANNER: Record<PlacedResult, { text: string; warning: boolean }> =
  {
    cod: {
      text: "Order confirmed. Pay in cash when it arrives.",
      warning: false,
    },
    paid: {
      text: "Payment received. Your order will be confirmed in a moment.",
      warning: false,
    },
    pending: {
      text: "Payment not completed. Your order is saved; pay within 30 minutes or it will be cancelled.",
      warning: true,
    },
  };

export function OrdersPage() {
  const { ready } = useAuthGuard();
  const params = useSearchParams();
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
  const placed = params.get("placed") as PlacedResult | null;

  // Read the list again once the webhook has had time to confirm the payment.
  useEffect(() => {
    if (placed !== "paid") return;
    const timer = setTimeout(reload, CONFIRM_WAIT_MS);
    return () => clearTimeout(timer);
  }, [placed, reload]);

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
    <OrdersShell banner={placed ? PLACED_BANNER[placed] : undefined}>
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

function OrdersShell({
  children,
  banner,
}: {
  children: React.ReactNode;
  banner?: { text: string; warning: boolean };
}) {
  return (
    <div className="mx-auto max-w-4xl pb-12 pt-6 sm:pt-8">
      {banner && (
        <div
          role="status"
          className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 ${banner.warning ? "border-amber-300/40 bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300" : "border-accent/15 bg-accent/[0.07] text-accent"}`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${banner.warning ? "bg-amber-500" : "bg-accent"}`}
          >
            {banner.warning ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </span>
          <p className="text-sm font-extrabold">{banner.text}</p>
        </div>
      )}

      <h1 className="mb-5 font-display text-3xl font-bold">My orders</h1>
      {children}
    </div>
  );
}

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
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-sand bg-mist/50 px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03] sm:px-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
            Order ID
          </p>
          <p className="mt-0.5 text-xs font-extrabold">#{orderLabel}</p>
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
            Placed on
          </p>
          <p className="mt-0.5 text-xs font-extrabold">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`status-pill ml-auto gap-1.5 ${status.className}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {status.label}
        </span>
      </header>

      <div className="p-4 sm:p-5">
        <div className="space-y-2.5">
          {order.items.map((item, index) => (
            <div
              key={`${item.productName}-${index}`}
              className="flex justify-between gap-4 text-sm"
            >
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {item.productName}{" "}
                <span className="text-gray-400">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-extrabold">
                {inr(item.pricePaise * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-black/15 pt-4 dark:border-white/15">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <PaymentIcon className="h-4 w-4" />{" "}
            {order.paymentMethod === "COD"
              ? "Cash on delivery"
              : "Online payment"}
          </span>
          <span
            className={`status-pill ${order.paymentStatus === "COMPLETED" ? "bg-accent/10 text-accent" : order.paymentStatus === "REFUNDED" ? "bg-deal/10 text-deal" : "bg-gray-100 text-gray-500 dark:bg-white/10"}`}
          >
            {order.paymentStatus}
          </span>
          <span className="ml-auto font-display text-xl font-black">
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
