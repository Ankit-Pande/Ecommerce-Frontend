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

// Dashboard with today's numbers and quick links.
export default function AdminHome() {
  const { data: stats, loading, failed, load } = useAdminData(getStats);

  const cards = stats
    ? [
        {
          label: "Orders today",
          value: String(stats.ordersToday),
          icon: ShoppingBag,
          href: "/admin/orders",
          className: "from-accent to-sky-500",
        },
        {
          label: "Revenue today",
          value: inr(stats.revenueTodayPaise),
          icon: IndianRupee,
          href: "/admin/orders",
          className: "from-emerald-500 to-teal-500",
        },
        {
          label: "To ship",
          value: String(stats.toShip),
          icon: Truck,
          href: "/admin/orders",
          className: "from-violet-600 to-fuchsia-500",
        },
        {
          label: "Awaiting payment",
          value: String(stats.awaitingPayment),
          icon: Clock3,
          href: "/admin/orders",
          className: "from-amber-500 to-orange-500",
        },
        {
          label: "Needs review",
          value: String(stats.needsReview),
          icon: AlertTriangle,
          href: "/admin/orders",
          className:
            stats.needsReview > 0
              ? "from-rose-600 to-deal"
              : "from-slate-500 to-slate-400",
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
              : cards.map(({ label, value, icon: Icon, href, className }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${className}`}
                  >
                    <Icon className="absolute -right-2 -top-2 h-16 w-16 opacity-20" />
                    <p className="text-xs font-semibold text-white/85">
                      {label}
                    </p>
                    <p className="mt-3 font-display text-2xl font-extrabold">
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
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist dark:bg-white/[0.06]">
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
