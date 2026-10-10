"use client";

import { getStats } from "@/api/admin";
import { OfflineNotice } from "@/components/ui/offline-notice";
import AdminOrders from "@/features/admin/orders-page";
import { useAdminData } from "@/features/admin/use-admin-data";
import { inr } from "@/lib/format";

// Dashboard: today's numbers on coloured tiles, then the orders table.
export default function AdminHome() {
  const { data: stats, loading, failed, load } = useAdminData(getStats);

  const tiles = stats
    ? [
        ["Orders today", String(stats.ordersToday), "#0B7A5C"],
        ["Revenue today", inr(stats.revenueTodayPaise), "#1D3FA8"],
        ["Delivery pending", String(stats.toShip), "#B4235A"],
        ["Awaiting payment", String(stats.awaitingPayment), "#C7421F"],
        ["Needs review", String(stats.needsReview), "#5B3FC4"],
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      {failed ? (
        <OfflineNotice onRetry={load} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="card h-[110px] animate-pulse border-t-8 border-line"
                />
              ))
            : tiles.map(([label, value, color]) => (
                <div
                  key={label}
                  className="card border-t-8 p-[18px]"
                  style={{ borderTopColor: color }}
                >
                  <p className="font-semibold text-muted">{label}</p>
                  <p className="text-4xl font-extrabold">{value}</p>
                </div>
              ))}
        </div>
      )}
      <AdminOrders />
    </div>
  );
}
