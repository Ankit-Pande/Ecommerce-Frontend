"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock3, PackageCheck, Truck } from "lucide-react";
import { inr } from "@/lib/format";

const RESULTS = {
  cod: {
    title: "Order confirmed!",
    text: "Your order is on its way to being packed. Pay in cash or UPI when it arrives.",
    badge: "Cash on delivery",
  },
  paid: {
    title: "Payment received!",
    text: "Thank you. Your order is confirmed and will be packed soon.",
    badge: "Paid online",
  },
  pending: {
    title: "Payment pending",
    text: "Your order is saved. Pay from My orders within 30 minutes or it will be cancelled.",
    badge: "Waiting for payment",
  },
};

// Shown after checkout: a moving delivery truck, order number and next steps.
export function OrderSuccess() {
  const params = useSearchParams();
  const result =
    RESULTS[params.get("result") as keyof typeof RESULTS] ?? RESULTS.cod;
  const pending = result === RESULTS.pending;
  const orderId = params.get("id") ?? "";
  const total = Number(params.get("total"));

  return (
    <div className="mx-auto max-w-xl py-10 sm:py-16">
      <div className="card overflow-hidden text-center">
        <div
          className={`relative h-44 overflow-hidden ${pending ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-accent to-sky-500"}`}
        >
          <div className="absolute inset-x-0 bottom-10 h-1 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.7)_0_24px,transparent_24px_44px)] animate-road" />
          <span className="absolute bottom-11 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-white text-accent shadow-soft animate-truck">
            {pending ? (
              <Clock3 className="h-10 w-10 text-orange-500" />
            ) : (
              <Truck className="h-10 w-10" />
            )}
          </span>
        </div>

        <div className="px-6 pb-8 pt-6">
          <span
            className={`status-pill gap-1.5 ${pending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            <PackageCheck className="h-3.5 w-3.5" /> {result.badge}
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            {result.title}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            {result.text}
          </p>

          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 rounded-2xl bg-mist p-4 text-left dark:bg-white/5">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Order ID
              </dt>
              <dd className="mt-0.5 font-extrabold">
                #{orderId.slice(0, 8).toUpperCase()}
              </dd>
            </div>
            {total > 0 && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Amount
                </dt>
                <dd className="mt-0.5 font-extrabold">{inr(total)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/orders" className="btn-primary">
              {pending ? "Pay from My orders" : "Track my order"}
            </Link>
            <Link href="/products" className="btn-outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
