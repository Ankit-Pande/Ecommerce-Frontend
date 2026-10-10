"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getOrder } from "@/api/order";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { OrderStatusPill } from "@/features/orders/order-parts";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { inr, tintFor } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";

const PAYMENT_TEXT = {
  cod: "Cash on Delivery",
  paid: "Paid online",
  pending: "Payment pending",
};

// Shown after checkout: order ID, amount, payment, items and next steps.
export function OrderSuccess() {
  const { ready } = useAuthGuard();
  const params = useSearchParams();
  const orderId = params.get("id") ?? "";
  const result = (params.get("result") ?? "cod") as keyof typeof PAYMENT_TEXT;
  const pending = result === "pending";
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (!ready || !orderId) return;
    getOrder(orderId).then(setOrder, () => setOrder(null));
  }, [ready, orderId]);

  return (
    <section className="flex flex-col items-center gap-3.5 rounded-[28px] bg-sunny px-6 py-[72px] text-center shadow-card">
      <span className="grid h-[88px] w-[88px] place-items-center rounded-full bg-accent text-white">
        <svg
          aria-hidden="true"
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h1 className="text-[32px] font-extrabold sm:text-[40px]">
        {pending ? "Order saved, payment pending" : "Order confirmed"}
      </h1>
      {pending && (
        <p className="font-semibold">
          Pay from My orders within 30 minutes or the order is cancelled.
        </p>
      )}

      <div className="grid w-full max-w-[760px] grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <Tile label="Order ID" className="bg-white">
          #{orderId.slice(0, 8).toUpperCase()}
        </Tile>
        <Tile label="Amount" className="bg-[#D6F0FF]">
          {order ? inr(order.totalPaise) : "…"}
        </Tile>
        <Tile label="Payment" className="bg-[#FFD9E6]">
          {PAYMENT_TEXT[result] ?? PAYMENT_TEXT.cod}
        </Tile>
      </div>

      {order ? (
        <>
          <div className="flex flex-wrap justify-center gap-2.5">
            {order.items.map((item) => (
              <Link
                key={item.productId}
                href={`/products/${item.product.slug}`}
                className="flex min-h-12 items-center gap-2 rounded-[14px] border border-line bg-white py-1.5 pl-1.5 pr-3.5 font-semibold"
              >
                <span
                  className="relative h-9 w-9 rounded-lg"
                  style={{ background: tintFor(item.productId) }}
                >
                  <SafeImage
                    src={item.productImage}
                    alt=""
                    sizes="36px"
                    className="object-contain p-0.5"
                  />
                </span>
                {item.productName} × {item.quantity}
              </Link>
            ))}
          </div>
          <OrderStatusPill status={order.status} />
        </>
      ) : (
        <div className="w-full max-w-[760px]">
          <ListSkeleton count={1} />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={pending ? "/orders" : `/orders/${orderId}`}
          className="btn-primary min-h-[52px] rounded-[14px] px-7"
        >
          {pending ? "Pay from My orders" : "Track order"}
        </Link>
        <Link href="/" className="btn-outline min-h-[52px] rounded-[14px] px-7">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

// One label and big value tile.
function Tile({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[18px] p-4 ${className}`}>
      <p className="font-semibold text-muted">{label}</p>
      <p className="text-[26px] font-extrabold">{children}</p>
    </div>
  );
}
