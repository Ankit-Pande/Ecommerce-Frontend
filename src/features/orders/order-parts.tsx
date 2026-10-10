"use client";

import { useState } from "react";
import { Check, Clock3, PackageCheck, Truck, XCircle } from "lucide-react";
import { errorMessage } from "@/api/http";
import { cancelOrder, retryPayment } from "@/api/order";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/store/toast-store";
import type { Order, OrderStatus } from "@/lib/types";

const TRACK_STEPS: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED"];

export const PAYMENT_LABEL = {
  PENDING: "Not paid yet",
  COMPLETED: "Paid",
  REFUNDED: "Refunded",
} as const;

export const CANCELLED_BY_TEXT = {
  USER: "You cancelled this order.",
  ADMIN: "The store cancelled this order.",
  SYSTEM:
    "Cancelled automatically because the payment was not completed in time.",
} as const;

const STATUS: Record<
  OrderStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  PENDING: {
    label: "Payment pending",
    className: "bg-amber-100 text-amber-700",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-700",
    icon: PackageCheck,
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-violet-100 text-violet-700",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-700",
    icon: Check,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

// Only an unshipped, unpaid order can be cancelled.
export function canCancel(order: Order) {
  return (
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    order.paymentStatus === "PENDING"
  );
}

// An unpaid online order can be paid until its deadline.
export function canPay(order: Order) {
  return (
    order.paymentMethod === "ONLINE" &&
    order.status === "PENDING" &&
    order.paymentStatus === "PENDING" &&
    order.paymentExpiresAt !== null &&
    new Date(order.paymentExpiresAt).getTime() > Date.now()
  );
}

// Coloured status chip with an icon.
export function StatusPill({ status }: { status: OrderStatus }) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span className={`status-pill gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

// Confirmed → shipped → delivered progress line; hidden for pending or cancelled orders.
export function OrderTracker({ status }: { status: OrderStatus }) {
  const reached = TRACK_STEPS.indexOf(status);
  if (reached < 0) return null;
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
              className={`grid h-7 w-7 place-items-center rounded-full ${index <= reached ? "bg-accent text-white" : "bg-gray-200 text-gray-400"}`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <span
              className={`text-[11px] font-bold ${index <= reached ? "text-accent" : "text-gray-400"}`}
            >
              {label}
            </span>
          </span>
          {index < labels.length - 1 && (
            <span
              className={`mx-2 mb-5 h-1 flex-1 rounded-full ${index < reached ? "bg-accent" : "bg-gray-200"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

// Cancel and pay-again actions shared by the orders list and the order page.
export function useOrderActions({
  onCancelled,
  onPaid,
}: {
  onCancelled: (id: string) => void;
  onPaid: () => void;
}) {
  const [cancellingId, setCancellingId] = useState("");
  const [payingId, setPayingId] = useState("");

  // Cancels an order after a confirm.
  async function cancel(id: string) {
    if (!window.confirm("Cancel this order? This action cannot be undone."))
      return;
    setCancellingId(id);
    try {
      const response = await cancelOrder(id);
      onCancelled(id);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorMessage(error, "Could not cancel this order"));
    } finally {
      setCancellingId("");
    }
  }

  // Opens Razorpay again for an unpaid order.
  async function pay(id: string) {
    setPayingId(id);
    try {
      const payment = await retryPayment(id);
      const opened = openRazorpay(payment, {
        onPaid: () => {
          toast.success("Payment received. Your order is confirmed.");
          onPaid();
        },
        onClose: () => toast.error("Payment is not complete yet."),
      });
      if (!opened) toast.error("The payment window could not open. Try again.");
    } catch (error) {
      toast.error(errorMessage(error, "Could not start the payment"));
    } finally {
      setPayingId("");
    }
  }

  return { cancel, pay, cancellingId, payingId };
}
