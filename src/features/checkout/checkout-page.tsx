"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Check, MapPin, Minus, Package, Plus, WalletCards } from "lucide-react";
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
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatAddress, inr } from "@/lib/format";
import { openRazorpay, RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { Address, PaymentDetails, PaymentMethod } from "@/lib/types";
import { CheckoutSteps } from "@/features/checkout/checkout-steps";
import { OrderSummary } from "@/features/checkout/order-summary";
import {
  PaymentMethods,
  type PaymentChoice,
} from "@/features/checkout/payment-methods";

const MAX_QUANTITY = 10;

type Line = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  quantity: number;
  mrpPaise: number;
  finalPaise: number;
  available: boolean;
};

// Checkout for the cart, or one product with ?buy=.
export function CheckoutPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const buySlug = useSearchParams().get("buy");
  const setCount = useCartStore((state) => state.setCount);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("COD");
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
    payment: PaymentDetails,
  ) {
    const params = new URLSearchParams({
      result,
      id: payment.orderId,
      total: String(payment.amount),
    });
    router.push(`/order-success?${params}`);
  }

  // Places the order, then opens Razorpay for online payment.
  async function placeOrder() {
    if (!selectedId || lines.length === 0) return;
    setPaying(true);
    const paymentMethod: PaymentMethod =
      paymentChoice === "COD" ? "COD" : "ONLINE";

    try {
      const payment = await checkout({
        idempotencyKey,
        addressId: selectedId,
        paymentMethod,
        ...(buySlug && {
          buyNow: {
            productId: lines[0].productId,
            quantity: lines[0].quantity,
          },
        }),
      });

      if (!buySlug) setCount(0);
      if (payment.paymentMethod === "COD") {
        showResult("cod", payment);
        return;
      }

      const opened = openRazorpay(payment, {
        display: razorpayDisplay(paymentChoice),
        onPaid: () => showResult("paid", payment),
        onClose: () => showResult("pending", payment),
      });
      if (!opened) showResult("pending", payment);
    } catch (error) {
      const message = errorMessage(error, "Checkout could not be completed");
      toast.error(
        paymentMethod === "ONLINE"
          ? `${message} You can choose Cash on delivery instead.`
          : message,
      );
    } finally {
      setPaying(false);
    }
  }

  if (!ready || loading) {
    return (
      <CheckoutShell>
        <ListSkeleton />
      </CheckoutShell>
    );
  }

  if (failed) {
    return (
      <CheckoutShell>
        <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />
      </CheckoutShell>
    );
  }

  if (lines.length === 0) {
    return (
      <CheckoutShell>
        <div className="card py-14 text-center">
          <p className="font-bold">Nothing to check out.</p>
          <Link href="/products" className="btn-primary mt-5">
            Browse products
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  const hasBlockedItems = lines.some((line) => !line.available);
  const selectedAddress = addresses.find(
    (address) => address.id === selectedId,
  );

  return (
    <CheckoutShell>
      {paymentChoice !== "COD" && (
        <Script
          src={RAZORPAY_SCRIPT}
          strategy="afterInteractive"
          onError={() => toast.error("Secure payment service could not load")}
        />
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
        <div className="space-y-5">
          <Section icon={Package} title={buySlug ? "Buying now" : "Items"}>
            <ul className="divide-y divide-sand dark:divide-white/10">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-mist dark:bg-white/[0.06]">
                    <SafeImage
                      src={line.image}
                      alt=""
                      sizes="96px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${line.slug}`}
                      className="line-clamp-2 text-base font-bold hover:text-accent"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-sm">
                      <span className="font-bold">{inr(line.finalPaise)}</span>
                      {line.mrpPaise > line.finalPaise && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          {inr(line.mrpPaise)}
                        </span>
                      )}
                    </p>
                    {!line.available && (
                      <p className="mt-0.5 text-xs font-bold text-deal">
                        Out of stock
                      </p>
                    )}
                  </div>
                  {buySlug ? (
                    <QuantityStepper
                      value={line.quantity}
                      onChange={changeBuyQuantity}
                    />
                  ) : (
                    <span className="text-xs text-gray-500">
                      × {line.quantity}
                    </span>
                  )}
                  <span className="w-20 shrink-0 text-right text-sm font-bold">
                    {inr(line.finalPaise * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
          <Section
            icon={MapPin}
            title="Delivery address"
            action={
              addresses.length < MAX_ADDRESSES &&
              !showAddressForm && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAddressForm(true)}
                  className="text-accent"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              )
            }
          >
            {showAddressForm ? (
              <AddressForm
                onSaved={handleAddressSaved}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : addresses.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="w-full rounded-2xl border-2 border-dashed border-sand p-8 text-center hover:border-accent/40 dark:border-white/15"
              >
                <Plus className="mx-auto h-6 w-6 text-accent" />
                <span className="mt-2 block text-sm font-bold">
                  Add a delivery address
                </span>
              </button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => {
                  const selected = address.id === selectedId;
                  return (
                    <label
                      key={address.id}
                      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition ${selected ? "border-accent bg-accent/[0.04]" : "border-sand hover:border-accent/30 dark:border-white/10"}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selected}
                        onChange={() => setSelectedId(address.id)}
                        className="sr-only"
                      />
                      <span
                        className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border ${selected ? "border-accent bg-accent text-white" : "border-gray-300"}`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <p className="pr-8 text-sm font-bold">
                        {address.fullName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        +91 {address.phone}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {formatAddress(address)}
                      </p>
                      {address.isDefault && (
                        <span className="status-pill mt-3 bg-accent/10 text-accent">
                          Default
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </Section>

          <Section icon={WalletCards} title="Payment method">
            <PaymentMethods value={paymentChoice} onChange={setPaymentChoice} />
          </Section>
        </div>

        <OrderSummary lines={lines.filter((line) => line.available)}>
          {selectedAddress && (
            <p className="mb-4 rounded-xl bg-mist/70 p-3 text-xs leading-5 text-gray-500 dark:bg-white/[0.05]">
              Delivering to{" "}
              <strong className="text-ink dark:text-gray-200">
                {selectedAddress.fullName}
              </strong>
              , {selectedAddress.city} {selectedAddress.pincode}
            </p>
          )}
          <Button
            onClick={placeOrder}
            loading={paying}
            disabled={!selectedId || hasBlockedItems}
            className="w-full bg-deal hover:bg-orange-600"
          >
            {paymentChoice === "COD" ? "Place order (COD)" : "Pay securely"}
          </Button>
          {hasBlockedItems && (
            <p className="mt-3 text-center text-xs font-bold text-deal">
              {buySlug
                ? "This product is out of stock."
                : "Some cart items are unavailable. Update your cart to continue."}
            </p>
          )}
        </OrderSummary>
      </div>
    </CheckoutShell>
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
    mrpPaise: product.pricePaise,
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
      mrpPaise: product.pricePaise,
      finalPaise: product.finalPricePaise,
      available: product.stockStatus !== "OUT_OF_STOCK",
    },
  ];
}

// Minus and plus quantity buttons.
function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-sand dark:border-white/15">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-bold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label="Increase quantity"
        className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Card with an icon title.
function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-accent">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Page title and steps around checkout.
function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-12 pt-6 sm:pt-8">
      <h1 className="mb-6 text-center font-display text-2xl font-bold sm:text-3xl">
        Checkout
      </h1>
      <CheckoutSteps current={2} />
      {children}
    </div>
  );
}

// Shows only the chosen payment type in Razorpay.
function razorpayDisplay(choice: PaymentChoice) {
  const instruments =
    choice === "UPI"
      ? [{ method: "upi" }]
      : [{ method: "card" }, { method: "netbanking" }];

  return {
    blocks: { payment: { name: "Pay using", instruments } },
    sequence: ["block.payment"],
    preferences: { show_default_blocks: false },
  };
}
