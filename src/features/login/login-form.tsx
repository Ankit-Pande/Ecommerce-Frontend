"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtp, verifyOtp } from "@/api/auth";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo-icon";
import { SafeImage } from "@/components/ui/safe-image";
import { tintAt } from "@/lib/colors";
import { minutesAndSeconds, phoneText } from "@/lib/format";
import { safeNextPath } from "@/lib/links";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import type { Category } from "@/lib/types";

const OTP_SECONDS = 120;
const RESEND_SECONDS = 60;
const EMPTY_OTP = ["", "", "", "", "", ""];
const MOBILE_NUMBER = /^[6-9]\d{9}$/;

// Login with mobile number and OTP; goes back to the page that sent the user here.
export function LoginForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const nextPath = safeNextPath(useSearchParams().get("next"));
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : 0;
  const secondsLeft = Math.max(0, OTP_SECONDS - elapsed);
  const resendIn = Math.max(0, RESEND_SECONDS - elapsed);
  const expired = sentAt > 0 && secondsLeft === 0;

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace(nextPath ?? (isAdmin(role) ? "/admin" : "/"));
    }
  }, [hydrated, accessToken, role, nextPath, router]);

  useEffect(() => {
    if (!sentAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sentAt]);

  // Sends the OTP to the typed number.
  async function sendCode() {
    if (!MOBILE_NUMBER.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendOtp(phone);
      setOtp(EMPTY_OTP);
      setSentAt(Date.now());
      setNow(Date.now());
      requestAnimationFrame(() => boxes.current[0]?.focus());
    } catch (sendError) {
      setError(
        errorMessage(sendError, "Could not send OTP. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  // Checks the 6-digit OTP and logs in.
  async function checkCode() {
    const code = otp.join("");
    if (code.length !== 6 || expired) return;
    setBusy(true);
    setError("");
    try {
      const result = await verifyOtp(phone, code);
      const auth = useAuthStore.getState();
      auth.setUser(result.user.phone, result.user.role);
      auth.setAccessToken(result.accessToken);
    } catch (verifyError) {
      setError(errorMessage(verifyError, "That OTP is wrong or has expired."));
      setOtp(EMPTY_OTP);
      boxes.current[0]?.focus();
      setBusy(false);
    }
  }

  // Puts typed or pasted digits into the OTP boxes and moves the focus.
  function typeDigits(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const next = [...otp];
    if (digits.length > 1) {
      const pasted = digits.slice(0, 6 - index);
      for (let offset = 0; offset < pasted.length; offset++) {
        next[index + offset] = pasted[offset];
      }
      setOtp(next);
      boxes.current[Math.min(5, index + digits.length)]?.focus();
      return;
    }
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) boxes.current[index + 1]?.focus();
  }

  // Backspace and arrow keys move between the OTP boxes.
  function moveWithKeys(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      boxes.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0)
      boxes.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5)
      boxes.current[index + 1]?.focus();
  }

  // Goes back to the mobile number step.
  function changeNumber() {
    setSentAt(0);
    setOtp(EMPTY_OTP);
    setError("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-6">
      <div
        aria-hidden
        className="absolute inset-0 grid auto-rows-[150px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 p-2.5"
      >
        {categories.length > 0 &&
          Array.from({ length: 48 }, (_, index) => {
            const category = categories[index % categories.length];
            return (
              <div
                key={index}
                className="relative rounded-[28px]"
                style={{ background: tintAt(index % categories.length) }}
              >
                <span className="absolute inset-[17%]">
                  <SafeImage src={category.image} alt="" sizes="100px" />
                </span>
              </div>
            );
          })}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (sentAt) void checkCode();
          else void sendCode();
        }}
        className="relative flex w-full max-w-[520px] flex-col gap-[18px] rounded-[40px] border-8 border-sunny bg-white px-[26px] py-8 shadow-[0_24px_64px_rgba(0,0,0,.5)]"
      >
        <Link
          href="/"
          aria-label="ApnaKart home"
          className="flex items-center gap-3 self-center text-[30px] font-extrabold text-accent sm:text-[34px]"
        >
          <LogoIcon size={56} />
          ApnaKart
        </Link>
        <h1 className="text-center text-[32px] font-extrabold leading-[1.1] sm:text-[38px]">
          {sentAt ? "Enter OTP" : "Login or sign up"}
        </h1>

        {!sentAt ? (
          <>
            <label className="flex flex-col gap-2 text-lg font-extrabold">
              Mobile number
              <span className="flex gap-1.5 rounded-[20px] bg-ground p-1.5">
                <span className="flex min-h-[60px] items-center rounded-2xl bg-ink px-4 text-xl text-white">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setPhone(digits.length > 10 ? digits.slice(-10) : digits);
                    setError("");
                  }}
                  className="min-h-[60px] min-w-0 flex-1 rounded-2xl bg-white px-4 text-xl font-semibold outline-none"
                />
              </span>
            </label>
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length !== 10}
              className="min-h-16 rounded-[20px] text-xl"
            >
              Send OTP
            </Button>
            <p className="text-center text-muted">
              New number? The account is created after OTP verification.
            </p>
          </>
        ) : (
          <>
            <p className="flex flex-wrap items-center justify-center gap-x-2">
              OTP sent to {phoneText(phone)}
              <button
                type="button"
                onClick={changeNumber}
                className="min-h-11 font-extrabold text-accent underline"
              >
                Change number
              </button>
            </p>
            <p
              role="timer"
              className="grid h-28 w-28 place-items-center self-center rounded-full border-[6px] border-ink bg-sunny text-center text-[26px] font-extrabold leading-[1.1]"
            >
              {expired ? "OTP expired" : minutesAndSeconds(secondsLeft)}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    boxes.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => typeDigits(index, event.target.value)}
                  onKeyDown={(event) => moveWithKeys(index, event)}
                  onFocus={(event) => event.target.select()}
                  aria-label={`OTP digit ${index + 1}`}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  disabled={expired}
                  className="min-h-16 min-w-0 rounded-[14px] border-b-4 border-accent bg-ground p-0 text-center text-[28px] font-extrabold outline-none disabled:opacity-50"
                />
              ))}
            </div>
            <Button
              type="submit"
              loading={busy}
              disabled={expired || otp.some((digit) => !digit)}
              className="min-h-16 rounded-[20px] text-xl disabled:bg-muted"
            >
              Verify and continue
            </Button>
            <button
              type="button"
              onClick={sendCode}
              disabled={busy || resendIn > 0}
              className="min-h-[52px] rounded-[20px] border-2 border-accent bg-white font-extrabold text-accent disabled:border-line disabled:text-muted"
            >
              {resendIn > 0
                ? `Resend OTP in ${minutesAndSeconds(resendIn)}`
                : "Resend OTP"}
            </button>
          </>
        )}

        {error && (
          <p role="alert" className="text-center font-semibold text-danger">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
