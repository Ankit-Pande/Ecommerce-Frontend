"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { buyNowHref, loginHref } from "@/lib/links";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { Product } from "@/lib/types";

// Add to cart and Buy now on a product card (or "Choose size / colour" / "Out of stock").
export function CardButtons({ product }: { product: Product }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const hydrated = useAuthStore((state) => state.hydrated);
  const updateCount = useCartStore((state) => state.updateCount);

  if (product.stockStatus === "OUT_OF_STOCK") {
    return (
      <p className="btn-grey w-full cursor-default text-danger hover:bg-grey">
        Out of stock
      </p>
    );
  }

  if (product.hasOptions) {
    return (
      <Link href={`/products/${product.slug}`} className="btn-grey w-full">
        Choose size / colour
      </Link>
    );
  }

  const buyPage = buyNowHref(product.slug);

  // Adds one item to the cart; guests go to login first.
  async function add() {
    if (!loggedIn) {
      router.push(loginHref(window.location.pathname + window.location.search));
      return;
    }
    setAdding(true);
    try {
      updateCount(await addToCart(product.id, 1));
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
        href={loggedIn ? buyPage : loginHref(buyPage)}
        className="btn-grey flex-[1_1_84px]"
      >
        Buy now
      </Link>
    </div>
  );
}
