import type { PaymentDetails } from "@/lib/types";

export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PopupOptions = {
  onPaid: () => void;
  onClose: () => void;
  display?: Record<string, unknown>;
};

// Opens the Razorpay popup; the backend webhook confirms the order.
export function openRazorpay(
  payment: PaymentDetails,
  options: PopupOptions,
): boolean {
  if (!window.Razorpay || !payment.razorpayOrderId || !payment.razorpayKeyId) {
    return false;
  }

  new window.Razorpay({
    key: payment.razorpayKeyId,
    amount: payment.amount,
    currency: "INR",
    name: "ApnaKart",
    description: "Secure order payment",
    order_id: payment.razorpayOrderId,
    ...(options.display && { config: { display: options.display } }),
    handler: options.onPaid,
    modal: { ondismiss: options.onClose },
    theme: { color: readAccentColor() },
  }).open();
  return true;
}

// Theme colour for the Razorpay popup.
function readAccentColor() {
  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim()
    .split(/\s+/)
    .join(", ");

  return channels ? `rgb(${channels})` : "#3f5f8f";
}
