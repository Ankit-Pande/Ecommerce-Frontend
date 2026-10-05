import { http } from "@/api/http";
import type {
  ApiData,
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
  buyNow?: { productId: string; quantity: number };
};

// Places an order from the cart or Buy now.
export async function checkout(input: CheckoutInput) {
  return (
    await http.post<ApiData<PaymentDetails>>("/api/order/checkout", input)
  ).data;
}

const OPEN_STATUSES = "PENDING,CONFIRMED,SHIPPED,DELIVERED";

// User's orders: active ones, or only the cancelled ones.
export function listOrders(cancelled: boolean, cursor?: string) {
  const params = new URLSearchParams({
    limit: "10",
    status: cancelled ? "CANCELLED" : OPEN_STATUSES,
  });
  if (cursor) params.set("cursor", cursor);
  return http.get<Paginated<Order>>(`/api/order?${params}`);
}

// One order with photos, address and payment.
export async function getOrder(id: string) {
  return (await http.get<ApiData<OrderDetail>>(`/api/order/${id}`)).data;
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
