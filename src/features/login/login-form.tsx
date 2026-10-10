"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { updateProfile } from "@/api/account";
import { sendOtp, verifyOtp } from "@/api/auth";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { TINTS } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import type { Category } from "@/lib/types";

const OTP_LENGTH = 6;
const PHONE_LENGTH = 10;
const OTP_VALID_SECONDS = 120;
const RESEND_AFTER_SECONDS = 60;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const FIELD =
  "min-h-12 rounded-xl border border-field px-3.5 outline-none focus:border-accent";

// Login and sign up with mobile number and a 6-digit OTP.
export function LoginForm({ categories }: { categories: Category[] }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();
  const params = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const requestedPath = params.get("next");
  const nextPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  useEffect(() => {
    if (hydrated && accessToken && !busy) router.replace(nextPath);
  }, [accessToken, busy, hydrated, nextPath, router]);

  useEffect(() => {
    if (!sent || expiresIn <= 0) return;
    const timer = setTimeout(() => setExpiresIn((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [expiresIn, sent]);

  const expired = sent && expiresIn === 0;
  const resendIn = Math.max(
    0,
    expiresIn - (OTP_VALID_SECONDS - RESEND_AFTER_SECONDS),
  );

  // Sends the OTP and starts the 2-minute timer.
  async function handleSendOtp() {
    if (!INDIAN_MOBILE.test(phone) || busy) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendOtp(phone);
      setSent(true);
      setOtp(Array(OTP_LENGTH).fill(""));
      setExpiresIn(OTP_VALID_SECONDS);
      requestAnimationFrame(() => otpInputs.current[0]?.focus());
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not send OTP. Try again."));
    } finally {
      setBusy(false);
    }
  }

  // Checks the OTP, logs in and saves the name for a new account.
  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || expired) return;
    setBusy(true);
    setError("");
    try {
      const result = await verifyOtp(phone, code);
      setAccessToken(result.accessToken);
      setUser(result.user.phone, result.user.role);
      if (mode === "signup" && name.trim().length >= 2) {
        await updateProfile({ name: name.trim() }).catch(() =>
          toast.error("Logged in, but your name was not saved."),
        );
      }
      router.replace(nextPath);
    } catch (requestError) {
      setError(
        errorMessage(requestError, "That OTP is incorrect or has expired."),
      );
      setBusy(false);
    }
  }

  // Updates one OTP digit and moves focus.
  function updateOtp(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setOtp((current) =>
      current.map((value, position) => (position === index ? digit : value)),
    );
    if (digit && index < OTP_LENGTH - 1) otpInputs.current[index + 1]?.focus();
  }

  // Backspace and arrow keys move between boxes.
  function handleOtpKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0)
      otpInputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0)
      otpInputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1)
      otpInputs.current[index + 1]?.focus();
  }

  // Fills all boxes from a pasted code.
  function pasteOtp(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (pasted.length !== OTP_LENGTH) return;
    event.preventDefault();
    setOtp(pasted.split(""));
    otpInputs.current[OTP_LENGTH - 1]?.focus();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sunny px-4 py-8">
      <div className="flex w-full max-w-[1100px] flex-wrap overflow-hidden rounded-[32px] bg-white shadow-pop">
        <div className="flex flex-[1_1_300px] flex-col gap-5 bg-accent p-8 text-white">
          <Link href="/" className="self-start text-4xl font-extrabold">
            ApnaKart
          </Link>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((category, index) => (
              <span
                key={category.id}
                className="rounded-[20px] p-3.5"
                style={{ background: TINTS[index] }}
              >
                <span className="relative block h-[150px]">
                  <SafeImage
                    src={category.image}
                    alt=""
                    sizes="200px"
                    className="object-contain"
                  />
                </span>
              </span>
            ))}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (sent && !expired) void handleVerifyOtp();
            else void handleSendOtp();
          }}
          className="flex flex-[1_1_320px] flex-col justify-center gap-4 p-8"
        >
          <h1 className="text-[40px] font-extrabold leading-[1.1] text-accent">
            {mode === "signup" ? "Create account" : "Login"}
          </h1>
          <div className="flex rounded-[14px] bg-ground p-1" role="tablist">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                onClick={() => setMode(tab)}
                className={`min-h-11 flex-1 rounded-[10px] font-extrabold ${mode === tab ? "bg-accent text-white" : "text-ink"}`}
              >
                {tab === "signup" ? "Sign up" : "Login"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <label className="flex flex-col gap-1.5 font-semibold">
              Full name
              <input
                className={FIELD}
                autoComplete="name"
                maxLength={80}
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 font-semibold">
            Mobile number
            <span className="flex gap-2">
              <span className={`${FIELD} flex items-center`}>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(event) => {
                  setPhone(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, PHONE_LENGTH),
                  );
                  setSent(false);
                  setError("");
                }}
                className={`${FIELD} min-w-0 flex-1`}
              />
            </span>
          </label>

          {!sent ? (
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length !== PHONE_LENGTH}
              className="min-h-[52px] rounded-[14px] text-[17px]"
            >
              Send OTP
            </Button>
          ) : (
            <>
              <p className="flex items-center justify-between gap-2 font-semibold">
                Enter 6-digit OTP
                <span
                  className="rounded-full bg-sunny px-3.5 py-1 font-extrabold tabular-nums"
                  aria-live="polite"
                >
                  {expired ? "OTP expired" : formatSeconds(expiresIn)}
                </span>
              </p>
              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputs.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => updateOtp(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={pasteOtp}
                    aria-label={`OTP digit ${index + 1}`}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    disabled={expired}
                    className="min-h-[52px] min-w-0 rounded-xl border border-field p-0 text-center text-[22px] font-extrabold outline-none focus:border-accent disabled:bg-soft"
                  />
                ))}
              </div>
              <Button
                type="submit"
                loading={busy}
                disabled={expired || otp.some((digit) => !digit)}
                className="min-h-[52px] rounded-[14px] text-[17px]"
              >
                Verify and continue
              </Button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={busy || resendIn > 0}
                className="min-h-11 font-extrabold text-accent disabled:text-muted"
              >
                {resendIn > 0
                  ? `Resend OTP in ${formatSeconds(resendIn)}`
                  : "Resend OTP"}
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="font-semibold text-danger">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// 119 to "1:59".
function formatSeconds(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
