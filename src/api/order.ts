import { http } from "@/api/http";
import type {
  ApiData,
  Order,
  Paginated,
  PaymentDetails,
  PaymentMethod,
} from "@/lib/types";

type CheckoutInput = {
  idempotencyKey: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  buyNow?: { productId: string; quantity: number };
};

// Places an order from the cart or Buy now.
export async function checkout(input: CheckoutInput) {
  return (
    await http.post<ApiData<PaymentDetails>>("/api/order/checkout", input)
  ).data;
}

// User's orders.
export function listOrders(cursor?: string) {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) params.set("cursor", cursor);
  return http.get<Paginated<Order>>(`/api/order?${params}`);
}

// Cancels an order.
export function cancelOrder(id: string) {
  return http.patch<{ message: string }>(`/api/order/${id}/cancel`);
}

// Same Razorpay order again for a closed popup.
export async function retryPayment(id: string) {
  return (await http.post<ApiData<PaymentDetails>>(`/api/order/${id}/payment`))
    .data;
}
