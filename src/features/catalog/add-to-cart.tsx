"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Zap } from "lucide-react";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";

// Add to cart and Buy now buttons; Buy now skips the cart.
export function AddToCart({
  productId,
  slug,
  inStock,
}: {
  productId: string;
  slug: string;
  inStock: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const hydrated = useAuthStore((state) => state.hydrated);
  const setCount = useCartStore((state) => state.setCount);

  const buyNowPage = `/checkout?buy=${encodeURIComponent(slug)}`;
  const buyNowHref = loggedIn
    ? buyNowPage
    : `/login?next=${encodeURIComponent(buyNowPage)}`;

  // Adds one item to the cart, or sends a guest to login.
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
      setAdded(true);
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setAdding(false);
    }
  }

  if (!inStock) {
    return (
      <Button disabled className="w-full sm:w-auto">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        onClick={add}
        loading={adding}
        disabled={!hydrated}
        className="px-3 sm:px-5"
      >
        {!adding &&
          (added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          ))}
        {adding ? "Adding..." : added ? "Added" : "Add to cart"}
      </Button>
      <Link
        href={buyNowHref}
        className="btn-primary bg-deal px-3 shadow-none hover:bg-orange-600 sm:px-5"
      >
        <Zap className="h-4 w-4" /> Buy now
      </Link>
    </div>
  );
}
