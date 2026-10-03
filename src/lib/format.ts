// The backend stores money as integer paise, so all formatting happens here.

import type { Address, StockStatus } from "@/lib/types";

// 49900 -> "₹499", 287960 -> "₹2,879.60" (paise shown only when there are any).
export function inr(paise: number): string {
  const digits = paise % 100 === 0 ? 0 : 2;
  return (
    "₹" +
    (paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

// The backend sends only a stock status, never the exact count.
export const STOCK_TEXT: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Hurry, only a few left",
  OUT_OF_STOCK: "Out of stock",
};

// "Galaxy S24 5G" -> "galaxy-s24-5g"
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "3:45 pm"
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatAddress(address: Address): string {
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}
