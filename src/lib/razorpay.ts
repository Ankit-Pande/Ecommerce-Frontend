import { verifyPayment } from "@/api/order";
import type { PaymentDetails } from "@/lib/types";

export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayMethod = "upi" | "card" | "netbanking";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type PaidResponse = { razorpay_payment_id: string; razorpay_signature: string };

// Opens the Razorpay window; returns false when the script or payment details are missing.
export function openRazorpay(
  payment: PaymentDetails,
  onDone: () => void,
  method?: RazorpayMethod,
) {
  if (!window.Razorpay || !payment.razorpayOrderId || !payment.razorpayKeyId) {
    return false;
  }

  new window.Razorpay({
    key: payment.razorpayKeyId,
    amount: payment.amount,
    currency: "INR",
    name: "ApnaKart",
    order_id: payment.razorpayOrderId,
    ...(method && {
      config: {
        display: {
          blocks: {
            chosen: { name: "Pay using", instruments: [{ method }] },
          },
          sequence: ["block.chosen"],
          preferences: { show_default_blocks: true },
        },
      },
    }),
    handler: (response: PaidResponse) =>
      verifyPayment(
        payment.orderId,
        response.razorpay_payment_id,
        response.razorpay_signature,
      ).then(onDone, onDone),
    modal: { ondismiss: onDone },
    theme: { color: "#0B7A5C" },
  }).open();
  return true;
}
