import { http } from "@/api/http";
import type { Address, ApiData, UserProfile } from "@/lib/types";

export type AddressPayload = Omit<Address, "id" | "isDefault" | "line2"> & {
  line2: string | null;
};

// Logged-in user's profile.
export async function getProfile() {
  return (await http.get<ApiData<UserProfile>>("/api/user/me")).data;
}

// Updates the user's name and email.
export function updateProfile(data: { name?: string; email?: string }) {
  return http.patch("/api/user/me", data);
}

// Saved addresses.
export async function listAddresses() {
  return (await http.get<ApiData<Address[]>>("/api/address")).data;
}

// Adds an address.
export async function createAddress(data: AddressPayload) {
  return (await http.post<ApiData<Address>>("/api/address", data)).data;
}

// Edits an address.
export async function updateAddress(
  id: string,
  data: Partial<AddressPayload> & { isDefault?: boolean },
) {
  return (await http.patch<ApiData<Address>>(`/api/address/${id}`, data)).data;
}

// Deletes an address.
export function deleteAddress(id: string) {
  return http.delete(`/api/address/${id}`);
}
