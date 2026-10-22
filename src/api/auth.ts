import { http } from "@/api/http";
import type { ApiData, LoginResult } from "@/lib/types";

// Sends a login OTP by SMS.
export function sendOtp(phone: string) {
  return http.post("/api/auth/send-otp", { phone });
}

// Logs in with the OTP; the refresh token comes back as a cookie.
export async function verifyOtp(phone: string, otp: string) {
  return (
    await http.post<ApiData<LoginResult>>("/api/auth/verify-otp", {
      phone,
      otp,
    })
  ).data;
}
