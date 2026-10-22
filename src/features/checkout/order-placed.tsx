"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { getOrder } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { CheckoutSteps } from "@/features/checkout/checkout-steps";
import { canPay, usePayAgain } from "@/features/orders/order-parts";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { tintFor } from "@/lib/colors";
import { inr, minutesAndSeconds, orderNumber } from "@/lib/format";
import { RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { toast } from "@/store/toast-store";
import type { OrderDetail } from "@/lib/types";

const DELIVERY_TEXT = {
  PENDING: "Pending",
  CONFIRMED: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Result page after checkout: paid, waiting for payment, or COD confirmed.
export function OrderPlaced() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const orderId = useSearchParams().get("id") ?? "";
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Loads the order and shows it.
  const loadOrder = useCallback(async () => {
    const fresh = await getOrder(orderId);
    setOrder(fresh);
    return fresh;
  }, [orderId]);

  const { paying, pay } = usePayAgain(
    () => void loadOrder().catch(() => undefined),
  );

  const waitingForPayment =
    order?.paymentMethod === "ONLINE" &&
    order.status === "PENDING" &&
    order.paymentStatus === "PENDING";

  useEffect(() => {
    if (!ready || !orderId) return;
    loadOrder().catch(() => setFailed(true));
  }, [ready, orderId, loadOrder]);

  useEffect(() => {
    if (order?.status === "CANCELLED") router.replace(`/orders/${order.id}`);
  }, [order, router]);

  useEffect(() => {
    if (!waitingForPayment) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waitingForPayment]);

  // Loads the order again to see if the payment arrived.
  async function checkPayment() {
    setChecking(true);
    try {
      const fresh = await loadOrder();
      if (fresh.paymentStatus !== "COMPLETED") {
        toast.error("Payment not received yet. Please try again in a minute.");
      }
    } catch {
      toast.error("Could not check the payment. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (!orderId) {
    return (
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-xl font-semibold">Order not found</p>
        <Link href="/orders" className="btn-primary">
          My orders
        </Link>
      </div>
    );
  }
  if (failed) {
    return (
      <OfflineNotice
        onRetry={() => {
          setFailed(false);
          loadOrder().catch(() => setFailed(true));
        }}
      />
    );
  }
  if (!order || order.status === "CANCELLED") return <ListSkeleton count={2} />;

  const itemChips = (
    <div className="flex flex-wrap justify-center gap-2.5">
      {order.items.map((item, index) => (
        <Link
          key={index}
          href={`/products/${item.product.slug}`}
          className="flex min-h-12 items-center gap-2 rounded-[14px] bg-white py-1.5 pl-1.5 pr-3.5 font-semibold text-ink"
        >
          <span
            className="relative h-9 w-9 shrink-0 rounded-lg"
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
  );

  if (waitingForPayment) {
    const secondsLeft = order.paymentExpiresAt
      ? Math.max(
          0,
          Math.floor((new Date(order.paymentExpiresAt).getTime() - now) / 1000),
        )
      : 0;
    return (
      <>
        <Script src={RAZORPAY_SCRIPT} strategy="lazyOnload" />
        <CheckoutSteps current={2} />
        <section className="flex flex-col items-center gap-4 rounded-[32px] bg-sunny-light px-5 py-14 text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full border-[6px] border-[#E0A100] bg-white text-[#5C4300]">
            <Clock
              className="h-[46px] w-[46px]"
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
          <h1 className="text-[34px] font-extrabold leading-[1.1] sm:text-[40px]">
            Payment pending
          </h1>
          <p className="text-lg">
            Pay {inr(order.totalPaise)} for order {orderNumber(order.id)} to
            confirm it.
          </p>
          <p
            role="timer"
            className="rounded-full bg-ink px-[22px] py-1.5 text-[22px] font-extrabold text-white"
          >
            {secondsLeft > 0 ? minutesAndSeconds(secondsLeft) : "Time over"}
          </p>
          {itemChips}
          <div className="flex flex-wrap justify-center gap-3">
            {canPay(order) && (
              <Button
                onClick={() => pay(order.id)}
                loading={paying}
                className="btn-big px-[26px]"
              >
                Pay now
              </Button>
            )}
            <Button
              variant="line"
              onClick={checkPayment}
              loading={checking}
              className="btn-big border-2 border-ink px-[26px] font-extrabold"
            >
              I have completed the payment
            </Button>
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex min-h-[52px] items-center px-3 font-extrabold underline"
            >
              Pay later
            </Link>
          </div>
        </section>
      </>
    );
  }

  const paid = order.paymentStatus === "COMPLETED";
  return (
    <>
      <CheckoutSteps current={3} />
      <section className="flex flex-col items-center gap-4 rounded-[32px] bg-accent px-5 py-14 text-center text-white">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-sunny text-ink">
          <Check className="h-12 w-12" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="text-[36px] font-extrabold leading-[1.1] sm:text-[44px]">
          Order confirmed
        </h1>
        <div className="grid w-full max-w-[860px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 text-left text-ink">
          <Tile
            label="Order ID"
            value={orderNumber(order.id)}
            color="#FFFFFF"
          />
          <Tile label="Amount" value={inr(order.totalPaise)} color="#D6F0FF" />
          <Tile
            label="Payment"
            value={paid ? "Paid" : "Pay on delivery"}
            color="#FFD9E6"
          />
          <Tile
            label="Delivery"
            value={DELIVERY_TEXT[order.status]}
            color="#FFF0B8"
          />
        </div>
        {itemChips}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex min-h-[52px] items-center rounded-[14px] bg-sunny px-7 font-extrabold text-ink"
          >
            Track order
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[52px] items-center rounded-[14px] border-2 border-white px-7 font-extrabold"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    </>
  );
}

// One small info tile (order id, amount, payment, delivery).
function Tile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[18px] p-3.5" style={{ background: color }}>
      <p className="font-semibold text-muted">{label}</p>
      <p className="text-[22px] font-extrabold">{value}</p>
    </div>
  );
}
