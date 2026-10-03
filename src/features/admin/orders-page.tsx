"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { listOrders, markOrderRefunded, updateOrderStatus } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { formatDate, inr } from "@/lib/format";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/lib/types";
import { toast } from "@/store/toast-store";
import { Button } from "@/components/ui/button";

const allStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// Backend rules: admin only moves an order forward, CONFIRMED comes from the
// payment webhook (or COD checkout), and a paid order is not cancelled here.
function nextStatuses(order: AdminOrder): OrderStatus[] {
  const unpaid = order.paymentStatus === "PENDING";
  if (order.status === "PENDING") return unpaid ? ["CANCELLED"] : [];
  if (order.status === "CONFIRMED")
    return unpaid ? ["SHIPPED", "CANCELLED"] : ["SHIPPED"];
  if (order.status === "SHIPPED") return ["DELIVERED"];
  return [];
}

function paymentStyle(status: PaymentStatus) {
  if (status === "COMPLETED") return "bg-accent/10 text-accent";
  if (status === "REFUNDED") return "bg-deal/10 text-deal";
  return "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300";
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOrders = useCallback(
    (cursor?: string) => listOrders(cursor, statusFilter),
    [statusFilter],
  );

  const { items, cursor, loading, loadingMore, failed, loadMore, reload } =
    usePaginatedList<AdminOrder>(loadOrders);

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id);

    try {
      await updateOrderStatus(id, status);
      // COD becomes paid on delivery, so reload to show the backend's values.
      reload();
      toast.success("Order status updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this order"));
    } finally {
      setBusyId("");
    }
  }

  // Admin refunded the customer from the Razorpay dashboard.
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">Order list</h2>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
          className="field w-auto text-xs font-bold"
        >
          <option value="">All order statuses</option>
          {allStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        {loading ? (
          <ListSkeleton />
        ) : failed ? (
          <OfflineNotice onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
            <PackageCheck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No orders found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((order) => {
              const PaymentIcon =
                order.paymentMethod === "COD" ? Banknote : CreditCard;
              const options = nextStatuses(order);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-sand p-4 transition hover:border-accent/15 hover:shadow-card dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                      <PackageCheck className="h-4 w-4" />
                    </span>

                    <div className="min-w-[180px] flex-1">
                      <h2 className="text-sm font-extrabold">
                        {order.shipName}
                        <span className="font-semibold text-gray-400">
                          {" - "}
                          {order.shipPhone}
                        </span>
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                        <span>{inr(order.totalPaise)}</span>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          <PaymentIcon className="h-3.5 w-3.5" />
                          {order.paymentMethod === "COD" ? "COD" : "Online"}
                        </span>
                        <span>-</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </p>
                    </div>

                    <span
                      className={`status-pill ${paymentStyle(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>

                    <select
                      value={order.status}
                      disabled={busyId === order.id || options.length === 0}
                      onChange={(event) => {
                        void updateStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        );
                      }}
                      aria-label={`Status for order ${order.id}`}
                      className="field w-auto text-xs font-extrabold"
                    >
                      <option value={order.status} disabled>
                        {order.status}
                      </option>
                      {options.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {order.needsReview && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-deal/10 px-3 py-2 text-xs font-extrabold text-deal">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="flex-1">
                        Payment needs review — refund it from the Razorpay
                        dashboard.
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => markRefunded(order.id)}
                        disabled={busyId === order.id}
                        className="px-3 py-1.5 text-xs"
                      >
                        Mark refunded
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}

            {cursor && (
              <div className="pt-3">
                <LoadMoreButton onClick={loadMore} loading={loadingMore} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
