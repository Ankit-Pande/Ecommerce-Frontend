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

// Colour and size chips, then Add to cart and Buy now (Buy now skips the cart).
export function AddToCart({
  productId,
  slug,
  colors,
  sizes,
}: {
  productId: string;
  slug: string;
  colors: string[];
  sizes: string[];
}) {
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : "");
  const [size, setSize] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const hydrated = useAuthStore((state) => state.hydrated);
  const setCount = useCartStore((state) => state.setCount);

  const missing =
    colors.length > 0 && !color
      ? "colour"
      : sizes.length > 0 && !size
        ? "size"
        : "";
  const buyPage = `/checkout?${new URLSearchParams({ buy: slug, ...(size && { size }), ...(color && { color }) })}`;

  // Adds one item to the cart, or sends a guest to login.
  async function add() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }
    setAdding(true);
    try {
      const cart = await addToCart(productId, 1, { size, color });
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
    <div className="flex w-full flex-col gap-3">
      {colors.length > 0 && (
        <OptionChips
          label="Colour"
          options={colors}
          value={color}
          onPick={setColor}
        />
      )}
      {sizes.length > 0 && (
        <OptionChips
          label="Size"
          options={sizes}
          value={size}
          onPick={setSize}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={add}
          disabled={!hydrated || adding || Boolean(missing)}
          className={`${BUTTON} bg-grey hover:bg-grey-strong`}
        >
          {adding ? "Adding…" : added ? "Added" : "Add to cart"}
        </button>
        {missing ? (
          <span
            className={`${BUTTON} cursor-not-allowed bg-grey-strong opacity-50`}
          >
            Buy now
          </span>
        ) : (
          <Link
            href={
              loggedIn ? buyPage : `/login?next=${encodeURIComponent(buyPage)}`
            }
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

// One row of option chips, the picked one filled.
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
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={label}
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
