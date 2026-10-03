"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, MapPin, Plus, WalletCards } from "lucide-react";
import { listAddresses } from "@/api/account";
import { getCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { checkout } from "@/api/order";
import { Button } from "@/components/ui/button";
import { formatAddress, inr } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import { AddressForm, MAX_ADDRESSES } from "@/features/account/address-form";
import { CheckoutSteps } from "./checkout-steps";
import { PaymentMethods, type PaymentChoice } from "./payment-methods";
import { ListSkeleton } from "@/components/ui/skeletons";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { openRazorpay, RAZORPAY_SCRIPT } from "@/lib/razorpay";
import type { Address, Cart, PaymentMethod } from "@/lib/types";

export function CheckoutPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const setCount = useCartStore((state) => state.setCount);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("UPI");
  const [paying, setPaying] = useState(false);
  // Same key for every click on this page: a double click or retry returns the
  // same order from the backend instead of creating a second one.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setFailed(false);

    Promise.all([listAddresses(), getCart()])
      .then(([savedAddresses, freshCart]) => {
        setAddresses(savedAddresses);
        const preferredAddress =
          savedAddresses.find((address) => address.isDefault) ??
          savedAddresses[0];
        setSelectedId(preferredAddress?.id ?? "");
        setCart(freshCart);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [ready, reloadKey]);

  function handleAddressSaved(address: Address) {
    setAddresses((current) => [...current, address]);
    setSelectedId(address.id);
    setShowAddressForm(false);
  }

  // My Orders shows a banner for each result: cod, paid or pending.
  function openOrders(placed: "cod" | "paid" | "pending") {
    router.push(`/orders?placed=${placed}`);
  }

  async function placeOrder() {
    if (!selectedId || !cart?.items.length) return;
    setPaying(true);
    const paymentMethod: PaymentMethod =
      paymentChoice === "COD" ? "COD" : "ONLINE";

    try {
      const payment = await checkout({
        idempotencyKey,
        addressId: selectedId,
        paymentMethod,
      });

      // The order now holds the cart items, so the cart badge is empty either way.
      setCount(0);
      if (payment.paymentMethod === "COD") {
        openOrders("cod");
        return;
      }

      const opened = openRazorpay(payment, {
        display: razorpayDisplay(paymentChoice),
        onPaid: () => openOrders("paid"),
        onClose: () => openOrders("pending"),
      });
      if (!opened) openOrders("pending");
    } catch (error) {
      toast.error(errorMessage(error, "Checkout could not be completed"));
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

  const cartIsEmpty = !cart?.items.length;
  // The backend rejects the whole order if any item cannot be bought.
  const hasBlockedItems = !!cart?.items.some(
    ({ product, quantity }) =>
      !product.isAvailable || quantity > product.maxQuantity,
  );
  const selectedAddress = addresses.find(
    (address) => address.id === selectedId,
  );

  return (
    <CheckoutShell>
      <Script
        src={RAZORPAY_SCRIPT}
        strategy="afterInteractive"
        onError={() => toast.error("Secure payment service could not load")}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
        <div className="space-y-5">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
                  <MapPin className="h-4 w-4" />
                </span>
                <p className="text-sm font-extrabold">Delivery address</p>
              </div>
              {addresses.length < MAX_ADDRESSES && !showAddressForm && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAddressForm(true)}
                  className="text-accent"
                >
                  <Plus className="h-4 w-4" /> Add address
                </Button>
              )}
            </div>

            {showAddressForm ? (
              <AddressForm
                onSaved={handleAddressSaved}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : addresses.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="card w-full border-dashed p-8 text-center hover:border-accent/30"
              >
                <Plus className="mx-auto h-6 w-6 text-accent" />
                <span className="mt-2 block text-sm font-extrabold">
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
                      className={`relative cursor-pointer rounded-2xl border-2 bg-white p-4 transition dark:bg-white/[0.04] ${selected ? "border-accent shadow-card" : "border-sand hover:border-accent/20 dark:border-white/10"}`}
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
                      <p className="pr-8 text-sm font-extrabold">
                        {address.fullName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {address.phone}
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
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
                <WalletCards className="h-4 w-4" />
              </span>
              <p className="text-sm font-extrabold">Payment method</p>
            </div>
            <PaymentMethods value={paymentChoice} onChange={setPaymentChoice} />
          </section>
        </div>

        <aside className="card p-5 lg:sticky lg:top-32 sm:p-6">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <div className="mt-4 max-h-48 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {cart?.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex justify-between gap-3 text-xs"
              >
                <span className="line-clamp-2 font-semibold text-gray-600 dark:text-gray-300">
                  {product.name}{" "}
                  <span className="text-gray-400">× {quantity}</span>
                </span>
                <span className="shrink-0 font-extrabold">
                  {inr(product.finalPricePaise * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-5 border-t border-dashed border-black/15 dark:border-white/15" />
          <div className="flex items-end justify-between">
            <span className="font-extrabold">Total payable</span>
            <span className="font-display text-2xl font-black">
              {cart ? inr(cart.totalPaise) : "—"}
            </span>
          </div>

          {selectedAddress && (
            <p className="mt-4 rounded-xl bg-mist/70 p-3 text-[11px] leading-5 text-gray-500 dark:bg-white/[0.05]">
              Delivering to{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                {selectedAddress.fullName}
              </strong>
              , {selectedAddress.city} {selectedAddress.pincode}
            </p>
          )}

          <Button
            onClick={placeOrder}
            loading={paying}
            disabled={!selectedId || cartIsEmpty || hasBlockedItems}
            className="mt-5 w-full"
          >
            {paymentChoice === "COD"
              ? "Place COD order"
              : `Pay ${cart ? inr(cart.totalPaise) : ""}`}
          </Button>
          {hasBlockedItems && (
            <p className="mt-3 text-center text-xs font-bold text-deal">
              Some cart items are unavailable. Update your cart to continue.
            </p>
          )}
        </aside>
      </div>
    </CheckoutShell>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-12 pt-6 sm:pt-8">
      <CheckoutSteps current={2} />
      <h1 className="mb-5 font-display text-3xl font-bold">Checkout</h1>
      {children}
    </div>
  );
}

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
