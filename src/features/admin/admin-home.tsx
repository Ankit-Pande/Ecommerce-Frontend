"use client";

import { getStats } from "@/api/admin";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { AdminTitle } from "@/features/admin/admin-shell";
import { OrdersTable } from "@/features/admin/orders-page";
import { useAdminData } from "@/features/admin/use-admin-data";
import { inr } from "@/lib/format";

// Admin dashboard: today's numbers and the orders table.
export function AdminHome() {
  const { data: stats, failed, load } = useAdminData(getStats);

  let tileCards;
  if (stats) {
    const tiles = [
      {
        label: "Orders today",
        value: String(stats.ordersToday),
        color: "#0B7A5C",
      },
      {
        label: "Revenue today",
        value: inr(stats.revenueTodayPaise),
        color: "#1D3FA8",
      },
      { label: "To ship", value: String(stats.toShip), color: "#B4235A" },
      {
        label: "Payment pending",
        value: String(stats.awaitingPayment),
        color: "#E0A100",
      },
    ];
    if (stats.needsReview > 0) {
      tiles.push({
        label: "Needs review",
        value: String(stats.needsReview),
        color: "#C7421F",
      });
    }
    tileCards = tiles.map((tile) => (
      <div
        key={tile.label}
        className="rounded-[20px] border-t-8 bg-white p-[18px] shadow-card"
        style={{ borderTopColor: tile.color }}
      >
        <p className="font-semibold text-muted">{tile.label}</p>
        <p className="text-[26px] font-extrabold sm:text-4xl">{tile.value}</p>
      </div>
    ));
  } else {
    tileCards = Array.from({ length: 4 }, (_, index) => (
      <div
        key={index}
        className="h-[112px] animate-pulse rounded-[20px] bg-white"
      />
    ));
  }

  return (
    <>
      <AdminTitle title="Dashboard" />
      {failed ? (
        <OfflineNotice onRetry={load} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] sm:gap-4">
          {tileCards}
        </div>
      )}
      <h2 className="section-title">Orders</h2>
      <OrdersTable />
    </>
  );
}
