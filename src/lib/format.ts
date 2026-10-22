import type { Address, OrderDetail } from "@/lib/types";

// Paise as rupees: 149900 -> "₹1,499", 149950 -> "₹1,499.50".
export function inr(paise: number) {
  const digits = paise % 100 === 0 ? 0 : 2;
  return (
    "₹" +
    (paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

// "17 Oct 2026".
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "4:05 pm".
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// An address on one line.
export function formatAddress(
  address: Pick<Address, "line1" | "line2" | "city" | "state" | "pincode">,
) {
  return [address.line1, address.line2, address.city, address.state]
    .filter(Boolean)
    .join(", ")
    .concat(` ${address.pincode}`);
}

// The address saved on an order, on one line.
export function shippingAddress(
  order: Pick<
    OrderDetail,
    "shipLine1" | "shipLine2" | "shipCity" | "shipState" | "shipPincode"
  >,
) {
  return formatAddress({
    line1: order.shipLine1,
    line2: order.shipLine2,
    city: order.shipCity,
    state: order.shipState,
    pincode: order.shipPincode,
  });
}

// "+91 98765 43210".
export function phoneText(phone: string) {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

// "1 rating" or "1,234 ratings".
export function ratingsText(count: number) {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? "rating" : "ratings"}`;
}

// The order number shoppers see: "#" and the first 8 characters of the id.
export function orderNumber(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

// "Size M · Black".
export function optionText(item: {
  size?: string | null;
  color?: string | null;
}) {
  return [item.size && `Size ${item.size}`, item.color]
    .filter(Boolean)
    .join(" · ");
}

// Seconds as "m:ss".
export function minutesAndSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// "Men's Shoes" -> "mens-shoes" (at most 120 characters, the API's limit).
export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .slice(0, 120)
    .replace(/^-|-$/g, "");
}
