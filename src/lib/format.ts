import type { Address, StockStatus } from "@/lib/types";

// Paise to rupees, like 49900 to "₹499".
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

export const STOCK_TEXT: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Hurry, only a few left",
  OUT_OF_STOCK: "Out of stock",
};

// "Galaxy S24" to "galaxy-s24".
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Date like "1 Oct 2026".
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Time like "3:45 pm".
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Address in one line.
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

// Product list link for a category or subcategory.
export function catalogHref(
  entry: { slug: string },
  level: "category" | "subcategory" = "category",
) {
  return `/products?${level}=${encodeURIComponent(entry.slug)}`;
}

// Soft background colours for category and product image tiles.
export const TINTS = [
  "#FFE1D6",
  "#FFF0B8",
  "#D6F0FF",
  "#E6DDFF",
  "#FFD9E6",
  "#DDF5C9",
  "#CFF3EA",
  "#FFE6C2",
];

// Same tint every time for the same id.
export function tintFor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}
