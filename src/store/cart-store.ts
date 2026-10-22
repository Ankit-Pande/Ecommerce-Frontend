"use client";

import { create } from "zustand";
import type { Cart } from "@/lib/types";

type CartState = {
  count: number;
  updateCount: (cart: Cart | null) => void;
};

// The cart count shown in the header.
export const useCartStore = create<CartState>((set) => ({
  count: 0,
  updateCount: (cart) =>
    set({
      count: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    }),
}));
