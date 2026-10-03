import { http } from "@/api/http";
import type { ApiData, LoginResult } from "@/lib/types";

export function sendOtp(phone: string) {
  return http.post("/api/auth/send-otp", { phone });
}

// The refresh token comes back as an httpOnly cookie, never in this body.
export async function verifyOtp(phone: string, otp: string) {
  const res = await http.post<ApiData<LoginResult>>("/api/auth/verify-otp", {
    phone,
    otp,
  });
  return res.data;
}
