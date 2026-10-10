"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";

// Small "Add" button on product cards; a guest goes to login first.
export function QuickAdd({ productId }: { productId: string }) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const router = useRouter();
  const loggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const hydrated = useAuthStore((s) => s.hydrated);
  const setCount = useCartStore((s) => s.setCount);

  // Adds one unit to the cart.
  async function add() {
    if (!loggedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    setState("adding");
    try {
      const cart = await addToCart(productId, 1);
      setCount(cart.items.length);
      setState("added");
      toast.success("Added to cart");
    } catch (error) {
      setState("idle");
      toast.error(errorMessage(error, "Could not add this product"));
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={!hydrated || state === "adding"}
      aria-label="Add to cart"
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-xs font-bold text-white transition hover:bg-accent disabled:opacity-60"
    >
      {state === "adding" ? (
        <Spinner />
      ) : state === "added" ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      {state === "added" ? "Added" : "Add"}
    </button>
  );
}
