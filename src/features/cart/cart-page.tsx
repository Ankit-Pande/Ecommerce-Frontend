"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, removeCartItem, updateCartItem } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { inr, tintFor } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import type { Cart } from "@/lib/types";

// Cart items with quantity controls and price details.
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

  let body: React.ReactNode;
  if (!ready || loading) body = <ListSkeleton />;
  else if (failed)
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  else if (!cart || cart.items.length === 0)
    body = (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <Link href="/" className="btn-primary min-h-12 px-7">
          Continue shopping
        </Link>
      </div>
    );
  else {
    const orderable = cart.items.filter(
      ({ product, quantity }) =>
        product.isAvailable && quantity <= product.maxQuantity,
    );
    const total = orderable.reduce(
      (sum, { product, quantity }) => sum + product.finalPricePaise * quantity,
      0,
    );

    body = (
      <div className="flex flex-wrap items-start gap-6">
        <div className="card flex-[2_1_420px] rounded-3xl px-[18px] py-1.5">
          {cart.items.map(({ product, quantity }) => {
            const busy = busyProductId === product.id;
            const href = `/products/${product.slug}`;
            return (
              <article
                key={product.id}
                className="flex flex-wrap items-center gap-4 border-b border-line py-3.5 last:border-b-0"
              >
                <Link
                  href={href}
                  aria-label={product.name}
                  className="rounded-[14px] p-2"
                  style={{ background: tintFor(product.id) }}
                >
                  <span className="relative block h-24 w-24 sm:h-32 sm:w-32">
                    <SafeImage
                      src={product.image}
                      alt=""
                      sizes="128px"
                      className="object-contain"
                    />
                  </span>
                </Link>
                <div className="flex flex-[1_1_200px] flex-col items-start gap-1">
                  <Link
                    href={href}
                    className="text-xl font-extrabold leading-tight sm:text-2xl"
                  >
                    {product.name}
                  </Link>
                  {product.rating.count > 0 && (
                    <p className="text-muted">
                      ★ {product.rating.average.toFixed(1)} (
                      {product.rating.count})
                    </p>
                  )}
                  <p className="font-semibold">
                    {inr(product.finalPricePaise)} each{" "}
                    {product.discountPercent > 0 && (
                      <>
                        <s className="font-normal text-muted">
                          {inr(product.pricePaise)}
                        </s>{" "}
                        ·{" "}
                        <span className="text-discount">
                          {product.discountPercent}% off
                        </span>
                      </>
                    )}
                  </p>
                  {!product.isAvailable ? (
                    <p className="font-semibold text-danger">
                      No longer available
                    </p>
                  ) : quantity > product.maxQuantity ? (
                    <p className="font-semibold text-danger">
                      {product.maxQuantity === 0
                        ? "Out of stock"
                        : `Only ${product.maxQuantity} available`}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, quantity - 1)}
                    disabled={busy}
                    aria-label="Decrease quantity"
                    className="h-11 w-11 text-xl"
                  >
                    −
                  </button>
                  <span
                    className="min-w-7 text-center font-extrabold"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, quantity + 1)}
                    disabled={busy || quantity >= product.maxQuantity}
                    aria-label="Increase quantity"
                    className="h-11 w-11 text-xl disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="min-w-[90px] text-right text-xl font-extrabold">
                  {inr(product.finalPricePaise * quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => changeQuantity(product.id, 0)}
                  disabled={busy}
                  className="min-h-11 font-semibold text-danger"
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>

        <aside className="card flex flex-[1_1_280px] flex-col gap-2.5 rounded-3xl p-5">
          <h2 className="text-[22px] font-extrabold">Price details</h2>
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{inr(total)}</span>
          </p>
          <p className="flex justify-between">
            <span>Delivery</span>
            <span>Free</span>
          </p>
          <p className="flex justify-between border-t border-line pt-2.5 text-xl font-extrabold">
            <span>Total</span>
            <span>{inr(total)}</span>
          </p>
          {orderable.length < cart.items.length ? (
            <p className="font-semibold text-danger">
              Remove or reduce the marked items to continue.
            </p>
          ) : (
            <Link
              href="/checkout"
              className="btn-primary min-h-[52px] rounded-[14px] text-[17px]"
            >
              Checkout
            </Link>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[32px] font-extrabold">Cart</h1>
      {body}
    </div>
  );
}
