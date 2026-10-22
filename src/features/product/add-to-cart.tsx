"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/api/cart";
import { errorMessage } from "@/api/http";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { buyNowHref, loginHref } from "@/lib/links";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/store/toast-store";
import type { ProductDetail } from "@/lib/types";

const BUTTON = "btn-grey min-h-10 px-4 text-[15px]";

// Colour, size and quantity choice with Add to cart and Buy now.
export function AddToCart({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const [color, setColor] = useState(
    product.colors.length === 1 ? product.colors[0] : "",
  );
  const [size, setSize] = useState(
    product.sizes.length === 1 ? product.sizes[0] : "",
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const hydrated = useAuthStore((state) => state.hydrated);
  const updateCount = useCartStore((state) => state.updateCount);

  const missing =
    product.colors.length > 0 && !color
      ? "colour"
      : product.sizes.length > 0 && !size
        ? "size"
        : "";
  const buyPage = buyNowHref(product.slug, { size, color, quantity });

  // Adds the chosen product to the cart; guests go to login first.
  async function add() {
    if (!loggedIn) {
      router.push(loginHref(`/products/${product.slug}`));
      return;
    }
    setAdding(true);
    try {
      updateCount(await addToCart(product.id, quantity, { size, color }));
      toast.success("Added to cart");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add this product"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {product.colors.length > 0 && (
        <OptionChips
          label="Colour"
          options={product.colors}
          value={color}
          onPick={setColor}
        />
      )}
      {product.sizes.length > 0 && (
        <OptionChips
          label="Size"
          options={product.sizes}
          value={size}
          onPick={setSize}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">Quantity</span>
        <QuantityStepper value={quantity} max={10} onChange={setQuantity} />
        <button
          type="button"
          onClick={add}
          disabled={!hydrated || adding || Boolean(missing)}
          className={BUTTON}
        >
          {adding ? "Adding…" : "Add to cart"}
        </button>
        {missing ? (
          <button type="button" disabled className={`${BUTTON} bg-grey-strong`}>
            Buy now
          </button>
        ) : (
          <Link
            href={loggedIn ? buyPage : loginHref(buyPage)}
            className={`${BUTTON} bg-grey-strong`}
          >
            Buy now
          </Link>
        )}
      </div>
      {missing && (
        <p className="text-sm font-semibold text-muted">
          Choose a {missing} to continue.
        </p>
      )}
    </div>
  );
}

// Pickable chips for colours or sizes.
function OptionChips({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: string[];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="mr-1 font-extrabold">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onPick(option)}
          className="chip"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
