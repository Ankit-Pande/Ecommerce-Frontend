import { http } from "@/api/http";
import type { Address, ApiData, UserProfile } from "@/lib/types";

// Address fields sent to the backend; null line2 clears it.
export type AddressPayload = Omit<Address, "id" | "isDefault" | "line2"> & {
  line2: string | null;
};

export async function getProfile() {
  return (await http.get<ApiData<UserProfile>>("/api/user/me")).data;
}

export function updateProfile(data: { name?: string; email?: string }) {
  return http.patch("/api/user/me", data);
}

export async function listAddresses() {
  return (await http.get<ApiData<Address[]>>("/api/address")).data;
}

export async function createAddress(data: AddressPayload) {
  return (await http.post<ApiData<Address>>("/api/address", data)).data;
}

export async function updateAddress(
  id: string,
  data: Partial<AddressPayload> & { isDefault?: boolean },
) {
  return (await http.patch<ApiData<Address>>(`/api/address/${id}`, data)).data;
}

export function deleteAddress(id: string) {
  return http.delete(`/api/address/${id}`);
}
