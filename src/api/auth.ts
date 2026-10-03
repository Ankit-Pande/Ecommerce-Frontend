import { http } from "@/api/http";
import type { ApiData, LoginResult } from "@/lib/types";

// Sends an OTP to the phone.
export function sendOtp(phone: string) {
  return http.post("/api/auth/send-otp", { phone });
}

// Checks the OTP and logs in; the refresh token comes as a cookie.
export async function verifyOtp(phone: string, otp: string) {
  const res = await http.post<ApiData<LoginResult>>("/api/auth/verify-otp", {
    phone,
    otp,
  });
  return res.data;
}
