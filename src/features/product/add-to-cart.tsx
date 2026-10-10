"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";

const BUTTON =
  "inline-flex min-h-10 flex-[0_1_150px] items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 text-[15px] font-semibold text-grey-ink transition disabled:opacity-50";

// Add to cart and Buy now buttons; Buy now skips the cart.
export function AddToCart({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const hydrated = useAuthStore((state) => state.hydrated);
  const setCount = useCartStore((state) => state.setCount);
  const buyPage = `/checkout?buy=${encodeURIComponent(slug)}`;

  // Adds one item to the cart, or sends a guest to login.
  async function add() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }
    setAdding(true);
    try {
      const cart = await addToCart(productId, 1);
      setCount(cart.items.length);
      setAdded(true);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex w-full flex-wrap gap-3">
      <button
        type="button"
        onClick={add}
        disabled={!hydrated || adding}
        className={`${BUTTON} bg-grey hover:bg-grey-strong`}
      >
        {adding ? "Adding…" : added ? "Added" : "Add to cart"}
      </button>
      <Link
        href={loggedIn ? buyPage : `/login?next=${encodeURIComponent(buyPage)}`}
        className={`${BUTTON} bg-grey-strong`}
      >
        Buy now
      </Link>
    </div>
  );
}
