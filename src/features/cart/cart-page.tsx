"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { getCart, removeCartItem, updateCartItem } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { Spinner } from "@/components/ui/spinner";
import { inr } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { CheckoutSteps } from "@/features/checkout/checkout-steps";
import { OrderSummary } from "@/features/checkout/order-summary";
import { SafeImage } from "@/components/ui/safe-image";
import type { Cart } from "@/lib/types";

// Cart items with quantity controls and summary.
export function CartPage() {
  const { ready } = useAuthGuard();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyProductId, setBusyProductId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const setCount = useCartStore((state) => state.setCount);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setFailed(false);

    getCart()
      .then((fresh) => {
        setCart(fresh);
        setCount(fresh.items.length);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [ready, reloadKey, setCount]);

  // Updates or removes an item.
  async function changeQuantity(productId: string, quantity: number) {
    setBusyProductId(productId);
    try {
      const fresh =
        quantity < 1
          ? await removeCartItem(productId)
          : await updateCartItem(productId, quantity);
      setCart(fresh);
      setCount(fresh.items.length);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update your cart"));
    } finally {
      setBusyProductId("");
    }
  }

  if (!ready || loading) {
    return (
      <CartShell>
        <ListSkeleton />
      </CartShell>
    );
  }

  if (failed) {
    return (
      <CartShell>
        <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />
      </CartShell>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <CartShell itemCount={0}>
        <div className="grid min-h-[48vh] place-items-center py-12 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ground text-accent">
              <ShoppingBag className="h-9 w-9" strokeWidth={1.5} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">
              Your cart is empty
            </h1>
            <Link href="/products" className="btn-primary mt-6">
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CartShell>
    );
  }

  const orderable = cart.items.filter(
    ({ product, quantity }) =>
      product.isAvailable && quantity <= product.maxQuantity,
  );
  const hasBlockedItems = orderable.length < cart.items.length;
  const itemCount = orderable.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartShell itemCount={itemCount}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
        <div className="space-y-3">
          {cart.items.map(({ product, quantity }) => {
            const busy = busyProductId === product.id;
            return (
              <article
                key={product.id}
                className="card flex gap-3 p-3.5 sm:gap-5 sm:p-5"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ground sm:h-32 sm:w-32"
                >
                  <SafeImage
                    src={product.image}
                    alt={product.name}
                    sizes="128px"
                    className="object-contain p-2.5"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${product.slug}`}
                        className="line-clamp-2 text-sm font-extrabold leading-5 hover:text-accent sm:text-base"
                      >
                        {product.name}
                      </Link>
                      {!product.isAvailable ? (
                        <p className="mt-1 text-xs font-extrabold text-discount">
                          No longer available
                        </p>
                      ) : quantity > product.maxQuantity ? (
                        <p className="mt-1 text-xs font-extrabold text-discount">
                          {product.maxQuantity === 0
                            ? "Out of stock"
                            : `Only ${product.maxQuantity} available`}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product.id, 0)}
                      disabled={busy}
                      aria-label={`Remove ${product.name}`}
                      className="icon-button -mr-1 -mt-1 text-gray-400 hover:text-discount"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-xl font-black">
                      {inr(product.finalPricePaise * quantity)}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-xs font-semibold text-gray-400 line-through">
                        {inr(product.pricePaise * quantity)}
                      </span>
                    )}
                    {quantity > 1 && (
                      <span className="text-xs text-gray-500">
                        {inr(product.finalPricePaise)} each
                      </span>
                    )}
                  </div>

                  <div className="mt-3 inline-flex items-center rounded-xl border border-black/10 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => changeQuantity(product.id, quantity - 1)}
                      disabled={busy}
                      aria-label="Decrease quantity"
                      className="grid h-8 w-8 place-items-center rounded-lg text-accent hover:bg-ground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      className="w-8 text-center text-xs font-extrabold"
                      aria-live="polite"
                    >
                      {busy ? <Spinner /> : quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product.id, quantity + 1)}
                      disabled={busy || quantity >= product.maxQuantity}
                      aria-label="Increase quantity"
                      className="grid h-8 w-8 place-items-center rounded-lg text-accent hover:bg-ground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <OrderSummary
          lines={orderable.map(({ product, quantity }) => ({
            mrpPaise: product.pricePaise,
            finalPaise: product.finalPricePaise,
            quantity,
          }))}
        >
          {hasBlockedItems ? (
            <p className="rounded-xl bg-discount/10 px-3 py-2.5 text-center text-xs font-bold text-discount">
              Remove or reduce the marked items to continue.
            </p>
          ) : (
            <Link
              href="/checkout"
              className="btn-primary w-full bg-discount hover:bg-orange-600"
            >
              Go to checkout <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </OrderSummary>
      </div>
    </CartShell>
  );
}

// Page title and steps around the cart.
function CartShell({
  children,
  itemCount,
}: {
  children: React.ReactNode;
  itemCount?: number;
}) {
  return (
    <div className="pb-12 pt-6 sm:pt-8">
      <h1 className="mb-6 text-center font-display text-2xl font-bold sm:text-3xl">
        Your shopping cart
        {itemCount !== undefined && (
          <span className="ml-2 align-middle text-sm font-medium text-gray-500">
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        )}
      </h1>
      <CheckoutSteps current={1} />
      {itemCount !== undefined && itemCount > 0 && (
        <p className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <Truck className="h-5 w-5 shrink-0" />
          Yay! This order gets free delivery. Cash on delivery is available.
        </p>
      )}
      {children}
    </div>
  );
}
