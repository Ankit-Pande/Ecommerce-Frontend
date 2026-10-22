"use client";

import { useCallback, useState } from "react";
import { listOrders, markOrderRefunded, updateOrderStatus } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { OrderStatusPill } from "@/features/orders/order-parts";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import {
  formatDate,
  formatTime,
  inr,
  optionText,
  orderNumber,
  phoneText,
  shippingAddress,
} from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminOrder, OrderStatus } from "@/lib/types";

type NewStatus = "SHIPPED" | "DELIVERED" | "CANCELLED";

const FILTERS: {
  label: string;
  status?: OrderStatus;
  needsReview?: boolean;
}[] = [
  { label: "All" },
  { label: "Payment pending", status: "PENDING" },
  { label: "To ship", status: "CONFIRMED" },
  { label: "Shipped", status: "SHIPPED" },
  { label: "Delivered", status: "DELIVERED" },
  { label: "Cancelled", status: "CANCELLED" },
  { label: "Needs review", needsReview: true },
];

const PAYMENT_PILL = {
  PENDING: { tone: "warn", label: "Unpaid" },
  COMPLETED: { tone: "good", label: "Paid" },
  REFUNDED: { tone: "bad", label: "Refunded" },
} as const;

// The buttons an order may show: ship, mark delivered, cancel (unpaid only).
function orderActions(order: AdminOrder) {
  const actions: { label: string; status: NewStatus }[] = [];
  if (order.status === "CONFIRMED" && !order.needsReview) {
    actions.push({ label: "Ship", status: "SHIPPED" });
  }
  if (order.status === "SHIPPED" && !order.needsReview) {
    actions.push({ label: "Mark delivered", status: "DELIVERED" });
  }
  if (
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    order.paymentStatus === "PENDING"
  ) {
    actions.push({ label: "Cancel", status: "CANCELLED" });
  }
  return actions;
}

// All orders with filters, actions and "Load more".
export function OrdersTable() {
  const [filterIndex, setFilterIndex] = useState(0);
  const [busyId, setBusyId] = useState("");
  const filter = FILTERS[filterIndex];

  // Loads one page of orders for the chosen filter.
  const loadOrders = useCallback(
    (cursor?: string) =>
      listOrders(cursor, {
        status: filter.status,
        needsReview: filter.needsReview,
      }),
    [filter],
  );
  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<AdminOrder>(loadOrders);

  // Ships, delivers or cancels an order (cancel asks first).
  async function changeStatus(order: AdminOrder, status: NewStatus) {
    if (
      status === "CANCELLED" &&
      !window.confirm(`Cancel order ${orderNumber(order.id)}?`)
    ) {
      return;
    }
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      toast.success("Order updated");
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this order"));
    } finally {
      setBusyId("");
    }
  }

  // Records a refund done in the Razorpay dashboard.
  async function markRefunded(order: AdminOrder) {
    if (
      !window.confirm(
        "Did you refund this payment from the Razorpay dashboard?",
      )
    ) {
      return;
    }
    setBusyId(order.id);
    try {
      await markOrderRefunded(order.id);
      toast.success("Refund recorded");
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Could not record the refund"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <div
        role="group"
        aria-label="Filter orders"
        className="flex flex-wrap gap-1.5"
      >
        {FILTERS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={index === filterIndex}
            onClick={() => setFilterIndex(index)}
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
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No orders here
        </p>
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
                      {orderNumber(order.id)}
                    </span>
                    <span className="text-sm text-muted">
                      {formatDate(order.createdAt)},{" "}
                      {formatTime(order.createdAt)}
                    </span>
                  </span>
                  <span>
                    <span className="block truncate">{order.shipName}</span>
                    <span className="text-sm text-muted">
                      {phoneText(order.shipPhone)}
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
                    {orderActions(order).map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        onClick={() => changeStatus(order, action.status)}
                        disabled={busyId === order.id}
                        className={`btn-table ${action.status === "CANCELLED" ? "text-danger" : ""}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </span>
                </div>
                <p className="flex flex-wrap gap-x-4 pb-2.5 text-sm text-muted">
                  {order.items.map((item, index) => (
                    <span key={index}>
                      {item.productName} × {item.quantity}
                      {optionText(item) && ` (${optionText(item)})`}
                    </span>
                  ))}
                  <span>Ship to {shippingAddress(order)}</span>
                </p>
                {order.needsReview && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-[#FFD9D9] px-3 py-2 font-semibold text-[#8E1B1B]">
                    <span className="flex-1">
                      Extra or late payment received. Refund it from the
                      Razorpay dashboard, then mark it refunded.
                    </span>
                    <button
                      type="button"
                      onClick={() => markRefunded(order)}
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
    </>
  );
}

// The admin orders page.
export function AdminOrders() {
  return (
    <>
      <AdminTitle title="Orders" />
      <OrdersTable />
    </>
  );
}
