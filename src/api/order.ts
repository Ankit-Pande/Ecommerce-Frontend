import { http } from "@/api/http";
import type {
  ApiData,
  Options,
  Order,
  OrderDetail,
  Paginated,
  PaymentDetails,
  PaymentMethod,
} from "@/lib/types";

type CheckoutInput = {
  idempotencyKey: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  buyNow?: { productId: string; quantity: number } & Partial<Options>;
};

// Places the order and returns the payment details.
export async function checkout(input: CheckoutInput) {
  return (
    await http.post<ApiData<PaymentDetails>>("/api/order/checkout", input)
  ).data;
}

// One page (10) of the user's orders.
export function listOrders(cursor?: string) {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) params.set("cursor", cursor);
  return http.get<Paginated<Order>>(`/api/order?${params}`);
}

// One order with items and address.
export async function getOrder(id: string) {
  return (
    await http.get<ApiData<OrderDetail>>(`/api/order/${encodeURIComponent(id)}`)
  ).data;
}

// Cancels an unpaid order.
export function cancelOrder(id: string) {
  return http.patch(`/api/order/${encodeURIComponent(id)}/cancel`);
}

// Sends Razorpay's payment proof so the backend can confirm the order.
export function verifyPayment(
  id: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  return http.post(`/api/order/${encodeURIComponent(id)}/verify-payment`, {
    razorpayPaymentId,
    razorpaySignature,
  });
}

// Payment details to pay an unpaid order again.
export async function retryPayment(id: string) {
  return (
    await http.post<ApiData<PaymentDetails>>(
      `/api/order/${encodeURIComponent(id)}/payment`,
    )
  ).data;
}
