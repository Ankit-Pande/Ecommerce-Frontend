"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { listAddresses } from "@/api/account";
import { addToCart, getCart, removeCartItem, updateCartItem } from "@/api/cart";
import { getProduct, getRelatedProducts } from "@/api/catalog";
import { errorMessage, logoutSession } from "@/api/http";
import { checkout } from "@/api/order";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { AddressForm, MAX_ADDRESSES } from "@/features/account/address-form";
import { cartProblem } from "@/features/cart/cart-problem";
import { CheckoutSteps } from "@/features/checkout/checkout-steps";
import {
  PaymentMethods,
  paymentName,
  razorpayMethod,
  type PaymentChoice,
} from "@/features/checkout/payment-methods";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { tintFor } from "@/lib/colors";
import { formatAddress, inr, optionText, phoneText } from "@/lib/format";
import { loginHref } from "@/lib/links";
import { openRazorpay, RAZORPAY_SCRIPT } from "@/lib/razorpay";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { Address, Cart, Product } from "@/lib/types";

type Line = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string;
  color: string;
  quantity: number;
  maxQuantity: number;
  pricePaise: number;
  problem: string;
};

// Checkout lines from the cart.
function cartLines(cart: Cart): Line[] {
  return cart.items.map((item) => ({
    key: item.id,
    productId: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    image: item.product.image,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    maxQuantity: item.product.maxQuantity,
    pricePaise: item.product.finalPricePaise,
    problem: cartProblem(item),
  }));
}

// The one checkout line for "Buy now", with a problem when it cannot be bought as chosen.
async function buyNowLines(
  slug: string,
  size: string,
  color: string,
  quantity: number,
): Promise<Line[]> {
  const product = await getProduct(slug);
  const needsSize = product.sizes.length > 0 && !product.sizes.includes(size);
  const needsColor =
    product.colors.length > 1 && !product.colors.includes(color);
  let problem = "";
  if (product.stockStatus === "OUT_OF_STOCK") problem = "Out of stock";
  else if (needsSize || needsColor) {
    problem = "Choose size and colour on the product page";
  }
  return [
    {
      key: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      size,
      color: product.colors.length === 1 ? product.colors[0] : color,
      quantity,
      maxQuantity: 10,
      pricePaise: product.finalPricePaise,
      problem,
    },
  ];
}

// Checkout in two steps: address (with items and suggestions), then payment and place order.
export function CheckoutPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const params = useSearchParams();
  const buySlug = params.get("buy");
  const buySize = params.get("size") ?? "";
  const buyColor = params.get("color") ?? "";
  const buyQuantity = Math.min(10, Math.max(1, Number(params.get("qty")) || 1));
  const onPaymentStep = params.get("step") === "payment";
  const phone = useAuthStore((state) => state.phone);
  const updateCount = useCartStore((state) => state.updateCount);

  const [lines, setLines] = useState<Line[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [payment, setPayment] = useState<PaymentChoice>("gpay");
  const [busyKey, setBusyKey] = useState("");
  const [placing, setPlacing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const attempt = useRef({ details: "", key: "" });

  useEffect(() => {
    if (!ready) return;
    setFailed(false);
    let loadLines;
    if (buySlug) {
      loadLines = buyNowLines(buySlug, buySize, buyColor, buyQuantity);
    } else {
      loadLines = getCart().then((cart) => {
        updateCount(cart);
        return cartLines(cart);
      });
    }

    Promise.all([listAddresses(), loadLines])
      .then(([saved, fresh]) => {
        setAddresses(saved);
        setAddressId(
          (current) =>
            saved.find((address) => address.id === current)?.id ??
            (saved.find((address) => address.isDefault) ?? saved[0])?.id ??
            "",
        );
        setLines(fresh);
      })
      .catch(() => setFailed(true));
  }, [ready, reloadKey, buySlug, buySize, buyColor, buyQuantity, updateCount]);

  const firstCartSlug = buySlug ? "" : (lines?.[0]?.slug ?? "");
  useEffect(() => {
    if (!firstCartSlug) return;
    let active = true;
    getRelatedProducts(firstCartSlug)
      .then((products) => {
        if (active) setSuggestions(products);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [firstCartSlug]);

  // Moves between the address and payment steps (kept in the URL).
  function goToStep(step: "address" | "payment") {
    const next = new URLSearchParams(params.toString());
    if (step === "payment") next.set("step", "payment");
    else next.delete("step");
    router.push(`/checkout?${next}`);
  }

  // Shows the new cart and updates the header count.
  function showCart(cart: Cart) {
    updateCount(cart);
    setLines(cartLines(cart));
  }

  // Changes a line's quantity (buy now changes only the page; cart lines are saved).
  async function changeQuantity(line: Line, quantity: number) {
    if (buySlug) {
      setLines([{ ...line, quantity }]);
      return;
    }
    setBusyKey(line.key);
    try {
      let fresh;
      if (quantity < 1) fresh = await removeCartItem(line.key);
      else fresh = await updateCartItem(line.key, quantity);
      showCart(fresh);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update your cart"));
    } finally {
      setBusyKey("");
    }
  }

  // Adds a suggested product to the cart.
  async function addSuggestion(product: Product) {
    setBusyKey(product.id);
    try {
      showCart(await addToCart(product.id, 1));
      toast.success("Added to your order");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setBusyKey("");
    }
  }

  // Picks the address that was just added.
  function addressSaved(address: Address) {
    setAddresses((current) => [...current, address]);
    setAddressId(address.id);
    setAddingAddress(false);
  }

  const items = lines ?? [];
  const address = addresses.find((entry) => entry.id === addressId);
  const blocked = items.some((line) => line.problem);
  let itemCount = 0;
  let totalPaise = 0;
  for (const line of items) {
    itemCount += line.quantity;
    if (!line.problem) totalPaise += line.pricePaise * line.quantity;
  }
  const inCart = new Set(items.map((line) => line.productId));
  const shownSuggestions = suggestions
    .filter(
      (product) =>
        !inCart.has(product.id) &&
        !product.hasOptions &&
        product.stockStatus !== "OUT_OF_STOCK",
    )
    .slice(0, 6);

  // Places the order (same idempotency key for the same address, payment and items), then opens Razorpay or the result page.
  async function placeOrder() {
    if (!address || items.length === 0 || blocked) return;
    const online = payment !== "cod";
    const details = `${address.id}|${online}|${items.map((line) => `${line.key}x${line.quantity}`).join(",")}`;
    if (attempt.current.details !== details) {
      attempt.current = { details, key: crypto.randomUUID() };
    }

    setPlacing(true);
    try {
      const line = items[0];
      const result = await checkout({
        idempotencyKey: attempt.current.key,
        addressId: address.id,
        paymentMethod: online ? "ONLINE" : "COD",
        ...(buySlug && {
          buyNow: {
            productId: line.productId,
            quantity: line.quantity,
            ...(line.size && { size: line.size }),
            ...(line.color && { color: line.color }),
          },
        }),
      });
      if (!buySlug) updateCount(null);

      const resultPage = `/order-placed?id=${result.orderId}`;
      // Opens the order result page.
      const showResult = () => router.replace(resultPage);
      if (result.paymentMethod === "COD") showResult();
      else if (!openRazorpay(result, showResult, razorpayMethod(payment))) {
        showResult();
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not place the order"));
      setPlacing(false);
    }
  }

  let body: React.ReactNode;
  if (failed) {
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  } else if (!lines) {
    body = <ListSkeleton />;
  } else if (items.length === 0) {
    body = (
      <div className="card flex flex-col items-center gap-4 p-10">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <Link href="/" className="btn-primary px-7">
          Continue shopping
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-4">
          <section className="card flex flex-col gap-3 p-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold">
                {onPaymentStep ? "You are buying" : "Your items"}
              </h2>
              {!buySlug && (
                <Link href="/" className="btn-outline rounded-full">
                  + Add more items
                </Link>
              )}
            </div>

            {items.map((line) => (
              <LineRow
                key={line.key}
                line={line}
                busy={busyKey === line.key || placing}
                canRemove={!buySlug}
                onChange={changeQuantity}
              />
            ))}

            {onPaymentStep ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                <span className="font-extrabold">Deliver to</span>
                <span className="min-w-0 flex-[1_1_200px]">
                  {address
                    ? `${address.fullName}, ${formatAddress(address)}`
                    : "No address chosen"}
                </span>
                <button
                  type="button"
                  onClick={() => goToStep("address")}
                  className="min-h-11 font-extrabold text-accent"
                >
                  Change
                </button>
              </div>
            ) : (
              shownSuggestions.length > 0 && (
                <>
                  <h3 className="font-extrabold">Add to this order</h3>
                  <div className="flex gap-3 overflow-x-auto pb-1.5">
                    {shownSuggestions.map((product) => (
                      <div
                        key={product.id}
                        className="flex w-[168px] shrink-0 flex-col gap-1.5 rounded-[18px] border border-line p-2.5"
                      >
                        <Link
                          href={`/products/${product.slug}`}
                          aria-label={product.name}
                          className="rounded-xl p-2"
                          style={{ background: tintFor(product.id) }}
                        >
                          <span className="relative block h-[70px]">
                            <SafeImage
                              src={product.image}
                              alt=""
                              sizes="150px"
                            />
                          </span>
                        </Link>
                        <Link
                          href={`/products/${product.slug}`}
                          className="line-clamp-2 min-h-[46px] font-semibold"
                        >
                          {product.name}
                        </Link>
                        <span className="font-extrabold">
                          {inr(product.finalPricePaise)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addSuggestion(product)}
                          disabled={busyKey === product.id}
                          className="btn-grey"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </section>

          {onPaymentStep ? (
            <section className="card flex flex-col gap-3 p-[18px]">
              <h2 className="text-xl font-extrabold">Choose payment method</h2>
              <PaymentMethods
                value={payment}
                totalPaise={totalPaise}
                onChange={setPayment}
              />
            </section>
          ) : (
            <>
              <section className="flex flex-wrap items-center gap-3 rounded-[20px] bg-white p-[18px] shadow-card">
                <div className="flex-[1_1_200px]">
                  <p className="font-extrabold text-accent">Mobile number</p>
                  <p className="text-lg font-semibold">
                    {phone ? phoneText(phone) : ""} · Verified by OTP
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void logoutSession(
                      loginHref(
                        window.location.pathname + window.location.search,
                      ),
                    )
                  }
                  className="btn-line"
                >
                  Change
                </button>
              </section>

              <section className="flex flex-col gap-3 rounded-[20px] bg-white p-[18px] shadow-card">
                <h2 className="font-extrabold text-accent">Deliver to</h2>
                {addingAddress ? (
                  <AddressForm
                    onSaved={addressSaved}
                    onCancel={() => setAddingAddress(false)}
                  />
                ) : (
                  <>
                    {addresses.length > 0 && (
                      <div
                        role="radiogroup"
                        aria-label="Delivery address"
                        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3"
                      >
                        {addresses.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            role="radio"
                            aria-checked={entry.id === addressId}
                            onClick={() => setAddressId(entry.id)}
                            className={`flex flex-col gap-1 rounded-2xl border-2 bg-white p-3.5 text-left ${entry.id === addressId ? "border-accent" : "border-line"}`}
                          >
                            <span className="font-extrabold">
                              {entry.isDefault ? "Default · " : ""}
                              {entry.fullName}
                            </span>
                            <span>{formatAddress(entry)}</span>
                            <span className="text-muted">
                              {phoneText(entry.phone)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {addresses.length < MAX_ADDRESSES && (
                      <button
                        type="button"
                        onClick={() => setAddingAddress(true)}
                        className="min-h-11 self-start font-extrabold text-accent"
                      >
                        + Add new address
                      </button>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="card flex flex-[1_1_280px] flex-col gap-2.5 p-5">
          <h2 className="text-[22px] font-extrabold">
            {onPaymentStep ? "Amount to pay" : "Order summary"}
          </h2>
          {!onPaymentStep && (
            <SummaryRow label="Items" value={String(itemCount)} />
          )}
          <SummaryRow label="Subtotal" value={inr(totalPaise)} />
          <SummaryRow label="Delivery" value="Free" />
          {onPaymentStep && (
            <SummaryRow label="Paying with" value={paymentName(payment)} />
          )}
          <p className="flex justify-between border-t border-line pt-2.5 text-[22px] font-extrabold">
            <span>Total</span>
            <span>{inr(totalPaise)}</span>
          </p>
          {onPaymentStep ? (
            <Button
              onClick={placeOrder}
              loading={placing}
              disabled={!address || blocked}
              className="btn-big min-h-14 text-lg"
            >
              {payment === "cod" ? "Place order" : `Pay ${inr(totalPaise)}`}
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => goToStep("payment")}
              disabled={!address || blocked}
              className="btn-primary btn-big"
            >
              Continue to payment
            </button>
          )}
          {!address && (
            <p className="font-semibold text-danger">Add a delivery address.</p>
          )}
          {blocked && (
            <p className="font-semibold text-danger">
              Fix the marked items to continue.
            </p>
          )}
        </aside>
      </div>
    );
  }

  return (
    <>
      {onPaymentStep && (
        <Script src={RAZORPAY_SCRIPT} strategy="afterInteractive" />
      )}
      <CheckoutSteps current={onPaymentStep ? 2 : 1} />
      <h1 className="page-title">{onPaymentStep ? "Payment" : "Checkout"}</h1>
      {body}
    </>
  );
}

// One checkout line with image, options, quantity and price.
function LineRow({
  line,
  busy,
  canRemove,
  onChange,
}: {
  line: Line;
  busy: boolean;
  canRemove: boolean;
  onChange: (line: Line, quantity: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[18px] bg-soft p-2.5">
      <Link
        href={`/products/${line.slug}`}
        aria-label={line.name}
        className="shrink-0 rounded-[14px] p-2"
        style={{ background: tintFor(line.productId) }}
      >
        <span className="relative block h-20 w-20">
          <SafeImage src={line.image} alt="" sizes="80px" />
        </span>
      </Link>
      <div className="min-w-0 flex-[1_1_160px]">
        <p className="text-lg font-extrabold leading-snug">{line.name}</p>
        {optionText(line) && <p className="text-muted">{optionText(line)}</p>}
        <p className="text-muted">{inr(line.pricePaise)} each</p>
        {line.problem && (
          <p className="font-semibold text-danger">{line.problem}</p>
        )}
      </div>
      <QuantityStepper
        value={line.quantity}
        max={line.maxQuantity}
        disabled={busy}
        onChange={(quantity) => onChange(line, quantity)}
      />
      <p className="min-w-[84px] text-right text-xl font-extrabold">
        {inr(line.pricePaise * line.quantity)}
      </p>
      {canRemove && (
        <button
          type="button"
          onClick={() => onChange(line, 0)}
          disabled={busy}
          className="btn-remove"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// One "label … value" row in the price summary.
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}
