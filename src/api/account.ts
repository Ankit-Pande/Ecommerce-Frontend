import { http } from "@/api/http";
import type { Address, ApiData, UserProfile } from "@/lib/types";

type AddressInput = Omit<Address, "id" | "isDefault">;

// The logged-in user's profile.
export async function getProfile() {
  return (await http.get<ApiData<UserProfile>>("/api/user/me")).data;
}

// Saves a new name or email.
export async function updateProfile(data: { name?: string; email?: string }) {
  return (await http.patch<ApiData<UserProfile>>("/api/user/me", data)).data;
}

// Deletes the account for good.
export function deleteAccount() {
  return http.delete("/api/user/me");
}

// The user's saved addresses, default first.
export async function listAddresses() {
  return (await http.get<ApiData<Address[]>>("/api/address")).data;
}

// Saves a new address.
export async function createAddress(data: AddressInput) {
  return (await http.post<ApiData<Address>>("/api/address", data)).data;
}

// Changes an address or makes it the default.
export async function updateAddress(
  id: string,
  data: Partial<AddressInput> & { isDefault?: boolean },
) {
  return (
    await http.patch<ApiData<Address>>(
      `/api/address/${encodeURIComponent(id)}`,
      data,
    )
  ).data;
}

// Deletes an address.
export function deleteAddress(id: string) {
  return http.delete(`/api/address/${encodeURIComponent(id)}`);
}
