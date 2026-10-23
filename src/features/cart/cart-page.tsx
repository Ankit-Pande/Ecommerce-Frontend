"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, removeCartItem, updateCartItem } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { cartProblem } from "@/features/cart/cart-problem";
import { CheckoutSteps } from "@/features/checkout/checkout-steps";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { tintFor } from "@/lib/colors";
import { inr, optionText } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { Cart } from "@/lib/types";

// Cart page: lines with quantity and remove, price details and the checkout button.
export function CartPage() {
  const { ready } = useAuthGuard();
  const updateCount = useCartStore((state) => state.updateCount);
  const [cart, setCart] = useState<Cart | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) return;
    setFailed(false);
    getCart()
      .then((fresh) => {
        setCart(fresh);
        updateCount(fresh);
      })
      .catch(() => setFailed(true));
  }, [ready, reloadKey, updateCount]);

  // Sets a line's quantity (0 removes it) and updates the header count.
  async function changeQuantity(itemId: string, quantity: number) {
    setBusyId(itemId);
    try {
      let fresh;
      if (quantity < 1) fresh = await removeCartItem(itemId);
      else fresh = await updateCartItem(itemId, quantity);
      setCart(fresh);
      updateCount(fresh);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update your cart"));
    } finally {
      setBusyId("");
    }
  }

  let body: React.ReactNode;
  if (failed) {
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  } else if (!cart) {
    body = <ListSkeleton />;
  } else if (cart.items.length === 0) {
    body = (
      <div className="card flex flex-col items-center gap-4 p-10">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <Link href="/" className="btn-primary px-7">
          Continue shopping
        </Link>
      </div>
    );
  } else {
    const blocked = cart.items.some((item) => cartProblem(item));
    body = (
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-3.5">
          {cart.items.map((item) => {
            const { product } = item;
            const href = `/products/${product.slug}`;
            const busy = busyId === item.id;
            const problem = cartProblem(item);
            return (
              <article
                key={item.id}
                className="card flex flex-wrap items-center gap-4 p-3.5"
              >
                <Link
                  href={href}
                  aria-label={product.name}
                  className="shrink-0 rounded-[18px] p-3"
                  style={{ background: tintFor(product.id) }}
                >
                  <span className="relative block h-24 w-24 sm:h-32 sm:w-32">
                    <SafeImage src={product.image} alt="" sizes="128px" />
                  </span>
                </Link>
                <div className="flex min-w-0 flex-[1_1_220px] flex-col items-start gap-1.5">
                  <Link
                    href={href}
                    className="text-xl font-extrabold leading-tight sm:text-2xl"
                  >
                    {product.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-muted">
                    {optionText(item)}
                    {product.rating.count > 0 && (
                      <span className="rounded-full bg-accent px-2 py-px text-[13px] font-semibold text-white">
                        ★ {product.rating.average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold">
                    {inr(product.finalPricePaise)}{" "}
                    {product.discountPercent > 0 && (
                      <>
                        <s className="font-normal text-muted">
                          {inr(product.pricePaise)}
                        </s>{" "}
                        <span className="text-discount">
                          {product.discountPercent}% off
                        </span>
                      </>
                    )}
                  </p>
                  {problem && (
                    <p className="font-semibold text-danger">{problem}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      value={item.quantity}
                      max={product.maxQuantity}
                      disabled={busy}
                      onChange={(quantity) => changeQuantity(item.id, quantity)}
                    />
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 0)}
                      disabled={busy}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="ml-auto text-[26px] font-extrabold">
                  {inr(product.finalPricePaise * item.quantity)}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="card flex flex-[1_1_280px] flex-col gap-2.5 p-5">
          <h2 className="text-[22px] font-extrabold">Price details</h2>
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{inr(cart.totalPaise)}</span>
          </p>
          <p className="flex justify-between">
            <span>Delivery</span>
            <span>Free</span>
          </p>
          <p className="flex justify-between border-t border-line pt-2.5 text-[22px] font-extrabold">
            <span>Total</span>
            <span>{inr(cart.totalPaise)}</span>
          </p>
          {blocked ? (
            <p className="font-semibold text-danger">
              Remove or reduce the marked items to continue.
            </p>
          ) : (
            <Link href="/checkout" className="btn-primary btn-big">
              Continue to address
            </Link>
          )}
        </aside>
      </div>
    );
  }

  return (
    <>
      <CheckoutSteps current={0} />
      <h1 className="page-title">Cart</h1>
      {body}
    </>
  );
}
