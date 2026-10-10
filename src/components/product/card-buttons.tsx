"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";

// "Add to cart" and "Buy now" on product cards; a guest goes to login first.
export function CardButtons({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const loggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const hydrated = useAuthStore((s) => s.hydrated);
  const setCount = useCartStore((s) => s.setCount);
  const buyPage = `/checkout?buy=${encodeURIComponent(slug)}`;

  // Adds one unit to the cart.
  async function add() {
    if (!loggedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    setAdding(true);
    try {
      const cart = await addToCart(productId, 1);
      setCount(cart.items.length);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={add}
        disabled={!hydrated || adding}
        className="btn-grey flex-[1_1_84px]"
      >
        {adding ? "Adding…" : "Add to cart"}
      </button>
      <Link
        href={
          loggedIn ? buyPage : `/login?next=${encodeURIComponent(buyPage)}`
        }
        className="btn-grey flex-[1_1_84px]"
      >
        Buy now
      </Link>
    </div>
  );
}
