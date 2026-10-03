"use client";

import { create } from "zustand";

// Only the navbar badge count. Cart contents always come from the server.
type CartState = {
  count: number;
  setCount: (count: number) => void;
};

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
