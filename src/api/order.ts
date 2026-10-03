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
};

export async function checkout(input: CheckoutInput) {
  return (
    await http.post<ApiData<PaymentDetails>>("/api/order/checkout", input)
  ).data;
}

export function listOrders(cursor?: string) {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) params.set("cursor", cursor);
  return http.get<Paginated<Order>>(`/api/order?${params}`);
}

export function cancelOrder(id: string) {
  return http.patch<{ message: string }>(`/api/order/${id}/cancel`);
}

// Same Razorpay order again, for a popup that was closed before paying.
export async function retryPayment(id: string) {
  return (await http.post<ApiData<PaymentDetails>>(`/api/order/${id}/payment`))
    .data;
}
