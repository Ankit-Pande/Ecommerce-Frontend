"use client";

import { useCallback, useState } from "react";
import { listOrders, markOrderRefunded, updateOrderStatus } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { StatusPill } from "@/components/ui/status-pill";
import { OrderStatusPill } from "@/features/orders/order-parts";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatDate, formatTime, inr } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminOrder, OrderStatus } from "@/lib/types";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "To ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REVIEW", label: "Needs review" },
];

const PAYMENT_PILL = {
  PENDING: { tone: "yellow", label: "Unpaid" },
  COMPLETED: { tone: "green", label: "Paid" },
  REFUNDED: { tone: "red", label: "Refunded" },
} as const;

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  SHIPPED: "Ship",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel",
};

// Statuses the admin can move an order to.
function nextStatuses(order: AdminOrder): OrderStatus[] {
  const unpaid = order.paymentStatus === "PENDING";
  if (order.status === "PENDING") return unpaid ? ["CANCELLED"] : [];
  if (order.status === "CONFIRMED")
    return unpaid ? ["SHIPPED", "CANCELLED"] : ["SHIPPED"];
  if (order.status === "SHIPPED") return ["DELIVERED"];
  return [];
}

// Orders table with status tabs and actions.
export default function AdminOrders() {
  const [tab, setTab] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOrders = useCallback(
    (cursor?: string) =>
      tab === "REVIEW" ? listOrders(cursor, "", true) : listOrders(cursor, tab),
    [tab],
  );
  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<AdminOrder>(loadOrders);

  // Saves the new order status.
  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await updateOrderStatus(id, status);
      reload();
      toast.success("Order status updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this order"));
    } finally {
      setBusyId("");
    }
  }

  // Records a manual refund.
  async function markRefunded(id: string) {
    if (!window.confirm("Mark this payment as refunded in Razorpay?")) return;
    setBusyId(id);
    try {
      await markOrderRefunded(id);
      reload();
      toast.success("Refund recorded");
    } catch (error) {
      toast.error(errorMessage(error, "Could not record the refund"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Filter orders"
        className="flex flex-wrap gap-1.5"
      >
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className="chip"
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="card p-8 text-center font-semibold">No orders here</p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {items.map((order) => (
              <div
                key={order.id}
                className="border-b border-line last:border-b-0"
              >
                <div className="data-row border-b-0">
                  <span>
                    <span className="block font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-sm text-muted">
                      {formatDate(order.createdAt)},{" "}
                      {formatTime(order.createdAt)}
                    </span>
                  </span>
                  <span>
                    <span className="block truncate">{order.shipName}</span>
                    <span className="text-sm text-muted">
                      +91 {order.shipPhone}
                    </span>
                  </span>
                  <span className="font-semibold">{inr(order.totalPaise)}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {order.paymentMethod === "COD" ? "COD" : "Online"}
                    <StatusPill {...PAYMENT_PILL[order.paymentStatus]} />
                  </span>
                  <span>
                    <OrderStatusPill status={order.status} />
                    {order.cancelledBy && (
                      <span className="block text-sm text-muted">
                        by {order.cancelledBy.toLowerCase()}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {nextStatuses(order).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(order.id, status)}
                        disabled={busyId === order.id}
                        className={`btn-table ${status === "CANCELLED" ? "text-danger" : ""}`}
                      >
                        {ACTION_LABEL[status]}
                      </button>
                    ))}
                  </span>
                </div>
                {order.needsReview && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-[#FFD9D9] px-3 py-2 font-semibold text-[#8E1B1B]">
                    <span className="flex-1">
                      Payment needs review. Refund it from the Razorpay
                      dashboard.
                    </span>
                    <button
                      type="button"
                      onClick={() => markRefunded(order.id)}
                      disabled={busyId === order.id}
                      className="btn-table"
                    >
                      Mark refunded
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
    </div>
  );
}
