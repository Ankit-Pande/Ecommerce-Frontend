"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  IndianRupee,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { getStats } from "@/api/admin";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { useAdminData } from "@/features/admin/use-admin-data";
import { adminNav } from "@/features/admin/admin-nav";
import { inr } from "@/lib/format";

export default function AdminHome() {
  const { data: stats, loading, failed, load } = useAdminData(getStats);

  const cards = stats
    ? [
        {
          label: "Orders today",
          value: String(stats.ordersToday),
          icon: ShoppingBag,
          href: "/admin/orders",
        },
        {
          label: "Revenue today",
          value: inr(stats.revenueTodayPaise),
          icon: IndianRupee,
          href: "/admin/orders",
        },
        {
          label: "To ship",
          value: String(stats.toShip),
          icon: Truck,
          href: "/admin/orders",
        },
        {
          label: "Awaiting payment",
          value: String(stats.awaitingPayment),
          icon: Clock3,
          href: "/admin/orders",
        },
        {
          label: "Needs review",
          value: String(stats.needsReview),
          icon: AlertTriangle,
          href: "/admin/orders",
          warn: stats.needsReview > 0,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold">Quick stats</h2>
        {failed ? (
          <OfflineNotice onRetry={load} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[104px] animate-pulse rounded-2xl bg-mist dark:bg-white/10"
                  />
                ))
              : cards.map(({ label, value, icon: Icon, href, warn }) => (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-2xl border border-sand p-4 transition hover:shadow-card dark:border-white/10"
                  >
                    <p className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <Icon
                        className={`h-4 w-4 ${warn ? "text-deal" : "text-accent"}`}
                      />
                      {label}
                    </p>
                    <p
                      className={`mt-3 font-display text-2xl font-bold ${warn ? "text-deal" : ""}`}
                    >
                      {value}
                    </p>
                  </Link>
                ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminNav
            .filter((area) => area.href !== "/admin")
            .map((area) => {
              const Icon = area.icon;
              return (
                <Link
                  key={area.href}
                  href={area.href}
                  className="group flex items-center gap-3 rounded-2xl border border-sand p-4 transition hover:shadow-card dark:border-white/10"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-bold">{area.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
