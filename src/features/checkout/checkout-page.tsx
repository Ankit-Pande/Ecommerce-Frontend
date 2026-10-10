"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { listAddresses } from "@/api/account";
import { getCart } from "@/api/cart";
import { getProduct } from "@/api/catalog";
import { errorMessage } from "@/api/http";
import { checkout } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { AddressForm, MAX_ADDRESSES } from "@/features/account/address-form";
import {
  PaymentMethods,
  razorpayDisplay,
  type PaymentChoice,
} from "@/features/checkout/payment-methods";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatAddress, inr, tintFor } from "@/lib/format";
import { openRazorpay, RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { Address, PaymentDetails } from "@/lib/types";

const MAX_QUANTITY = 10;
const SECTION = "card flex flex-col gap-3 p-[18px]";
const STEP_TITLE = "font-extrabold text-accent";

type Line = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  quantity: number;
  finalPaise: number;
  available: boolean;
};

// Checkout for the cart, or one product with ?buy=.
export function CheckoutPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const buySlug = useSearchParams().get("buy");
  const phone = useAuthStore((state) => state.phone);
  const setCount = useCartStore((state) => state.setCount);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [payment, setPayment] = useState<PaymentChoice>("cod");
  const [paying, setPaying] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setFailed(false);

    Promise.all([listAddresses(), buySlug ? buyNowLines(buySlug) : cartLines()])
      .then(([savedAddresses, freshLines]) => {
        setAddresses(savedAddresses);
        const preferred =
          savedAddresses.find((address) => address.isDefault) ??
          savedAddresses[0];
        setSelectedId(preferred?.id ?? "");
        setLines(freshLines);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [ready, reloadKey, buySlug]);

  // Adds and selects a new address.
  function handleAddressSaved(address: Address) {
    setAddresses((current) => [...current, address]);
    setSelectedId(address.id);
    setShowAddressForm(false);
  }

  // Changes the Buy now quantity.
  function changeBuyQuantity(quantity: number) {
    setLines((current) => current.map((line) => ({ ...line, quantity })));
  }

  // Opens the order result page (confirmed, paid or payment pending).
  function showResult(
    result: "cod" | "paid" | "pending",
    details: PaymentDetails,
  ) {
    router.push(
      `/order-success?${new URLSearchParams({ result, id: details.orderId })}`,
    );
  }

  // Places the order, then opens Razorpay for online payment.
  async function placeOrder() {
    if (!selectedId || lines.length === 0) return;
    setPaying(true);
    const online = payment !== "cod";

    try {
      const details = await checkout({
        idempotencyKey,
        addressId: selectedId,
        paymentMethod: online ? "ONLINE" : "COD",
        ...(buySlug && {
          buyNow: {
            productId: lines[0].productId,
            quantity: lines[0].quantity,
          },
        }),
      });

      if (!buySlug) setCount(0);
      if (details.paymentMethod === "COD") {
        showResult("cod", details);
        return;
      }

      const opened = openRazorpay(details, {
        display: razorpayDisplay(payment),
        onPaid: () => showResult("paid", details),
        onClose: () => showResult("pending", details),
      });
      if (!opened) showResult("pending", details);
    } catch (error) {
      const message = errorMessage(error, "Checkout could not be completed");
      toast.error(
        online
          ? `${message} You can choose Cash on Delivery instead.`
          : message,
      );
    } finally {
      setPaying(false);
    }
  }

  let body: React.ReactNode;
  if (!ready || loading) body = <ListSkeleton />;
  else if (failed)
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  else if (lines.length === 0)
    body = (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10">
        <p className="text-xl font-semibold">Nothing to check out</p>
        <Link href="/" className="btn-primary min-h-12 px-7">
          Continue shopping
        </Link>
      </div>
    );
  else {
    const blocked = lines.some((line) => !line.available);
    const total = lines
      .filter((line) => line.available)
      .reduce((sum, line) => sum + line.finalPaise * line.quantity, 0);

    body = (
      <div className="flex flex-wrap items-start gap-6">
        {payment !== "cod" && (
          <Script
            src={RAZORPAY_SCRIPT}
            strategy="afterInteractive"
            onError={() => toast.error("Secure payment service could not load")}
          />
        )}
        <div className="flex flex-[2_1_420px] flex-col gap-4">
          <section className={SECTION}>
            <h2 className={STEP_TITLE}>1. Mobile number</h2>
            <p className="text-lg font-semibold">
              +91 {phone} · Verified by OTP
            </p>
          </section>

          <section className={SECTION}>
            <h2 className={STEP_TITLE}>2. Delivery address</h2>
            {showAddressForm ? (
              <AddressForm
                onSaved={handleAddressSaved}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        role="radio"
                        aria-checked={address.id === selectedId}
                        onClick={() => setSelectedId(address.id)}
                        className={`flex flex-col gap-1 rounded-[14px] border-2 bg-white p-3.5 text-left ${address.id === selectedId ? "border-accent" : "border-line"}`}
                      >
                        <span className="font-extrabold">
                          {address.isDefault ? "Default · " : ""}
                          {address.fullName}
                        </span>
                        <span>{formatAddress(address)}</span>
                        <span className="text-muted">+91 {address.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {addresses.length < MAX_ADDRESSES && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="min-h-11 self-start font-extrabold text-accent"
                  >
                    + Add new address
                  </button>
                )}
              </>
            )}
          </section>

          <section className={SECTION}>
            <h2 className={STEP_TITLE}>3. Order items and payment</h2>
            {lines.map((line) => (
              <div
                key={line.productId}
                className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-soft p-2.5"
              >
                <Link
                  href={`/products/${line.slug}`}
                  aria-label={line.name}
                  className="rounded-xl p-2"
                  style={{ background: tintFor(line.productId) }}
                >
                  <span className="relative block h-[88px] w-[88px]">
                    <SafeImage
                      src={line.image}
                      alt=""
                      sizes="88px"
                      className="object-contain"
                    />
                  </span>
                </Link>
                <div className="flex-[1_1_180px]">
                  <p className="text-xl font-extrabold">{line.name}</p>
                  {buySlug ? (
                    <QuantityStepper
                      value={line.quantity}
                      onChange={changeBuyQuantity}
                    />
                  ) : (
                    <p className="text-muted">Qty {line.quantity}</p>
                  )}
                  <p>{inr(line.finalPaise)} each</p>
                  {!line.available && (
                    <p className="font-semibold text-danger">Out of stock</p>
                  )}
                </div>
                <p className="text-2xl font-extrabold">
                  {inr(line.finalPaise * line.quantity)}
                </p>
              </div>
            ))}
            <h3 className="text-lg font-extrabold">Choose payment method</h3>
            <PaymentMethods value={payment} onChange={setPayment} />
            {payment === "cod" ? (
              <p className="rounded-xl bg-[#FFF0B8] px-3.5 py-3 font-semibold">
                Pay {inr(total)} in cash or UPI when the order is delivered.
              </p>
            ) : (
              <p className="rounded-xl bg-soft px-3.5 py-3 font-semibold">
                You will enter the payment details in the secure Razorpay
                window.
              </p>
            )}
          </section>
        </div>

        <aside className="card flex flex-[1_1_280px] flex-col gap-2.5 rounded-3xl p-5">
          <h2 className="text-[22px] font-extrabold">Order summary</h2>
          {lines.map((line) => (
            <Link
              key={line.productId}
              href={`/products/${line.slug}`}
              className="flex min-h-11 items-center gap-2.5"
            >
              <span
                className="rounded-[10px] p-1"
                style={{ background: tintFor(line.productId) }}
              >
                <span className="relative block h-10 w-10">
                  <SafeImage
                    src={line.image}
                    alt=""
                    sizes="40px"
                    className="object-contain"
                  />
                </span>
              </span>
              <span className="flex-1">
                {line.name} × {line.quantity}
              </span>
              <span className="font-extrabold">
                {inr(line.finalPaise * line.quantity)}
              </span>
            </Link>
          ))}
          <p className="flex justify-between border-t border-line pt-2.5">
            <span>Delivery</span>
            <span>Free</span>
          </p>
          <p className="flex justify-between text-xl font-extrabold">
            <span>Total</span>
            <span>{inr(total)}</span>
          </p>
          <Button
            onClick={placeOrder}
            loading={paying}
            disabled={!selectedId || blocked}
            className="min-h-[52px] rounded-[14px] text-[17px]"
          >
            {payment === "cod" ? "Place order" : `Pay ${inr(total)}`}
          </Button>
          {!selectedId && (
            <p className="font-semibold text-danger">Add a delivery address.</p>
          )}
          {blocked && (
            <p className="font-semibold text-danger">
              {buySlug
                ? "This product is out of stock."
                : "Some cart items are unavailable. Update your cart to continue."}
            </p>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[32px] font-extrabold">Checkout</h1>
      {body}
    </div>
  );
}

// Order lines from the cart.
async function cartLines(): Promise<Line[]> {
  const cart = await getCart();
  return cart.items.map(({ product, quantity }) => ({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    quantity,
    finalPaise: product.finalPricePaise,
    available: product.isAvailable && quantity <= product.maxQuantity,
  }));
}

// One order line for Buy now.
async function buyNowLines(slug: string): Promise<Line[]> {
  const product = await getProduct(slug);
  return [
    {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      quantity: 1,
      finalPaise: product.finalPricePaise,
      available: product.stockStatus !== "OUT_OF_STOCK",
    },
  ];
}

// Minus and plus quantity buttons for Buy now.
function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="my-1 inline-flex items-center gap-1 rounded-xl border border-line bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="h-11 w-11 text-xl disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-7 text-center font-extrabold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label="Increase quantity"
        className="h-11 w-11 text-xl disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
