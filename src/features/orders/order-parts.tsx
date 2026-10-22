"use client";

import { useState } from "react";
import { errorMessage } from "@/api/http";
import { retryPayment } from "@/api/order";
import { StatusPill, type PillTone } from "@/components/ui/status-pill";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/store/toast-store";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS: Record<OrderStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "Payment pending", tone: "warn" },
  CONFIRMED: { label: "Order confirmed", tone: "info" },
  SHIPPED: { label: "Delivery pending", tone: "warn" },
  DELIVERED: { label: "Delivered", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
};

const PAYMENT_STATUS = {
  PENDING: "Not paid yet",
  COMPLETED: "Paid",
  REFUNDED: "Refunded",
};

export const CANCELLED_BY_TEXT = {
  USER: "You cancelled this order.",
  ADMIN: "The store cancelled this order.",
  SYSTEM: "Cancelled because the payment was not completed in time.",
};

type OrderState = Pick<
  Order,
  | "status"
  | "paymentStatus"
  | "paymentMethod"
  | "paymentExpiresAt"
  | "needsReview"
>;

// Coloured status of an order.
export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusPill {...STATUS[status]} />;
}

// "Cash on Delivery", "Online · Paid" and so on.
export function paymentText(order: OrderState) {
  if (order.paymentMethod === "COD") {
    return order.paymentStatus === "COMPLETED"
      ? "Cash on Delivery · Paid"
      : "Cash on Delivery";
  }
  return `Online · ${PAYMENT_STATUS[order.paymentStatus]}`;
}

// Whether an unpaid online order can still be paid.
export function canPay(order: OrderState) {
  return (
    order.paymentMethod === "ONLINE" &&
    order.status === "PENDING" &&
    order.paymentStatus === "PENDING" &&
    !order.needsReview &&
    order.paymentExpiresAt !== null &&
    new Date(order.paymentExpiresAt).getTime() > Date.now()
  );
}

// Whether the order can be cancelled (unpaid and not shipped).
export function canCancel(order: OrderState) {
  return (
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    order.paymentStatus === "PENDING"
  );
}

// Opens Razorpay for an unpaid order and calls onDone when the window closes.
export function usePayAgain(onDone: () => void) {
  const [paying, setPaying] = useState(false);

  // Gets the payment details again and opens Razorpay.
  async function pay(orderId: string) {
    setPaying(true);
    try {
      const payment = await retryPayment(orderId);
      const opened = openRazorpay(payment, () => {
        setPaying(false);
        onDone();
      });
      if (!opened) {
        toast.error("The payment window could not open. Please try again.");
        setPaying(false);
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not start the payment"));
      setPaying(false);
    }
  }

  return { paying, pay };
}
