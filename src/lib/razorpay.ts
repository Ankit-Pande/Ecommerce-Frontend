import { verifyPayment } from "@/api/order";
import type { PaymentDetails } from "@/lib/types";

export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PaidResponse = { razorpay_payment_id: string; razorpay_signature: string };

type PopupOptions = {
  onPaid: () => void;
  onClose: () => void;
  display?: Record<string, unknown>;
};

// Opens the Razorpay popup; after payment the backend checks it and marks the order paid.
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
    handler: (response: PaidResponse) =>
      verifyPayment(
        payment.orderId,
        response.razorpay_payment_id,
        response.razorpay_signature,
      ).then(options.onPaid, options.onClose),
    modal: { ondismiss: options.onClose },
    theme: { color: "#2874f0" },
  }).open();
  return true;
}
