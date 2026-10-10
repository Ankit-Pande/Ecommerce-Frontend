"use client";

import { useState } from "react";
import { errorMessage } from "@/api/http";
import { cancelOrder, retryPayment } from "@/api/order";
import { openRazorpay } from "@/lib/razorpay";
import { StatusPill, type PillTone } from "@/components/ui/status-pill";
import { toast } from "@/store/toast-store";
import type { Order, OrderStatus } from "@/lib/types";

const TRACK_STEPS: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED"];
const TRACK_LABELS = [
  "Order placed",
  "Order confirmed",
  "Shipped",
  "Delivered",
];

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

const STATUS: Record<OrderStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "Payment pending", tone: "yellow" },
  CONFIRMED: { label: "Order confirmed", tone: "blue" },
  SHIPPED: { label: "Delivery pending", tone: "yellow" },
  DELIVERED: { label: "Delivered", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
};

// "Cash on Delivery" or "Online · Paid".
export function paymentText(order: Order) {
  return order.paymentMethod === "COD"
    ? "Cash on Delivery"
    : `Online · ${PAYMENT_LABEL[order.paymentStatus]}`;
}

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

// Order status pill.
export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusPill {...STATUS[status]} />;
}

// Order placed → confirmed → shipped → delivered, as a line with dots.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const reached = status === "CANCELLED" ? 1 : TRACK_STEPS.indexOf(status) + 2;

  return (
    <ol aria-label="Delivery status">
      {TRACK_LABELS.map((label, index) => {
        const done = index < reached;
        return (
          <li
            key={label}
            className={`relative ml-2.5 flex min-h-14 items-center gap-3.5 border-l-[3px] pl-[18px] ${done ? "border-accent" : "border-line"}`}
          >
            <span
              className={`absolute -left-[11px] h-[19px] w-[19px] rounded-full border-[3px] ${done ? "border-accent bg-accent" : "border-line bg-white"}`}
            />
            <span className="flex-1 font-semibold">{label}</span>
            <span className="text-muted">
              {done ? "Done" : status === "CANCELLED" ? "Cancelled" : "Pending"}
            </span>
          </li>
        );
      })}
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
