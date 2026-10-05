"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { listOrders, markOrderRefunded, updateOrderStatus } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatDate, formatTime, inr } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/lib/types";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "To ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REVIEW", label: "Needs review" },
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  CONFIRMED: "bg-accent/10 text-accent dark:text-sky-300",
  SHIPPED:
    "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  DELIVERED: "bg-leaf/10 text-leaf dark:text-emerald-300",
  CANCELLED: "bg-deal/10 text-deal",
};

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  COMPLETED: "bg-leaf/10 text-leaf dark:text-emerald-300",
  REFUNDED: "bg-deal/10 text-deal",
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

const ROW =
  "grid gap-x-4 gap-y-2 md:grid-cols-[minmax(0,2fr)_1fr_1.3fr_1fr_1.1fr_150px] md:items-center";

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
    <div>
      <div
        role="tablist"
        aria-label="Filter orders"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin"
      >
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
              tab === item.value
                ? "bg-accent text-white"
                : "bg-mist text-gray-600 hover:text-ink dark:bg-white/10 dark:text-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <ListSkeleton />
        ) : failed ? (
          <OfflineNotice onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand py-12 text-center dark:border-white/15">
            <PackageCheck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-bold">No orders here</p>
          </div>
        ) : (
          <>
            <div
              className={`${ROW} hidden border-b border-sand px-4 pb-3 text-xs font-semibold text-gray-500 dark:border-white/10 md:grid`}
            >
              <span>Customer</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>
            <ul className="space-y-2.5 md:space-y-0 md:divide-y md:divide-sand md:dark:divide-white/10">
              {items.map((order) => {
                const options = nextStatuses(order);
                return (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-sand p-4 dark:border-white/10 md:rounded-none md:border-0 md:px-4 md:py-3.5"
                  >
                    <div className={ROW}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {order.shipName}
                        </p>
                        <p className="text-xs text-gray-500">
                          +91 {order.shipPhone} · #
                          {order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <p className="text-sm font-bold">
                        {inr(order.totalPaise)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-500">
                          {order.paymentMethod === "COD" ? "COD" : "Online"}
                        </span>
                        <span
                          className={`status-pill ${PAYMENT_STYLE[order.paymentStatus]}`}
                        >
                          {order.paymentStatus === "COMPLETED"
                            ? "Paid"
                            : order.paymentStatus === "REFUNDED"
                              ? "Refunded"
                              : "Unpaid"}
                        </span>
                      </div>
                      <span>
                        <span
                          className={`status-pill w-fit ${STATUS_STYLE[order.status]}`}
                        >
                          {order.status}
                        </span>
                        {order.cancelledBy && (
                          <span className="mt-1 block text-[11px] text-gray-500">
                            by {order.cancelledBy.toLowerCase()}
                          </span>
                        )}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                        <span className="block">
                          {formatTime(order.createdAt)}
                        </span>
                      </p>
                      <select
                        value={order.status}
                        disabled={busyId === order.id || options.length === 0}
                        onChange={(event) =>
                          void updateStatus(
                            order.id,
                            event.target.value as OrderStatus,
                          )
                        }
                        aria-label={`Status for order ${order.id}`}
                        className="field min-h-9 py-1.5 text-xs font-bold"
                      >
                        <option value={order.status} disabled>
                          {options.length ? "Move to…" : "No action"}
                        </option>
                        {options.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {order.needsReview && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-deal/10 px-3 py-2 text-xs font-bold text-deal">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="flex-1">
                          Payment needs review — refund it from the Razorpay
                          dashboard.
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => markRefunded(order.id)}
                          disabled={busyId === order.id}
                          className="min-h-8 px-3 py-1 text-xs"
                        >
                          Mark refunded
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {cursor && (
              <div className="pt-5">
                <LoadMoreButton onClick={loadMore} loading={loadingMore} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
