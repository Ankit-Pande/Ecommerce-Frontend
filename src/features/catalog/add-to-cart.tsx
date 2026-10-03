"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Zap } from "lucide-react";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";

type Action = "cart" | "buy";

export function AddToCart({
  productId,
  inStock,
}: {
  productId: string;
  inStock: boolean;
}) {
  const [busyAction, setBusyAction] = useState<Action | null>(null);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const setCount = useCartStore((state) => state.setCount);

  async function add(action: Action) {
    if (!loggedIn) {
      const currentPage = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(currentPage)}`);
      return;
    }

    setBusyAction(action);
    try {
      const cart = await addToCart(productId, 1);
      setCount(cart.items.length);
      setAdded(true);
      if (action === "buy") router.push("/checkout");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setBusyAction(null);
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
        onClick={() => add("cart")}
        loading={busyAction === "cart"}
        disabled={busyAction !== null}
        className="px-3 sm:px-5"
      >
        {busyAction !== "cart" &&
          (added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          ))}
        {busyAction === "cart" ? "Adding..." : added ? "Added" : "Add to cart"}
      </Button>
      <Button
        onClick={() => add("buy")}
        loading={busyAction === "buy"}
        disabled={busyAction !== null}
        className="px-3 sm:px-5"
      >
        {busyAction !== "buy" && <Zap className="h-4 w-4" />}
        {busyAction === "buy" ? "Opening..." : "Buy now"}
      </Button>
    </div>
  );
}
