"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck, Smartphone } from "lucide-react";
import { sendOtp, verifyOtp } from "@/api/auth";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { Wordmark } from "@/components/ui/wordmark";

const OTP_LENGTH = 6;
const PHONE_LENGTH = 10;
// Same as the backend: an OTP lives 2 minutes, a new one can be sent after 60 seconds.
const OTP_VALID_SECONDS = 120;
const RESEND_AFTER_SECONDS = 60;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function PhoneAuthForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
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
  // Only same-site paths, so ?next= cannot send the user to another domain.
  const nextPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  useEffect(() => {
    if (hydrated && accessToken) router.replace(nextPath);
  }, [accessToken, hydrated, nextPath, router]);

  useEffect(() => {
    if (step !== "otp" || expiresIn <= 0) return;
    const timer = setTimeout(
      () => setExpiresIn((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [expiresIn, step]);

  const resendIn = Math.max(
    0,
    expiresIn - (OTP_VALID_SECONDS - RESEND_AFTER_SECONDS),
  );

  async function handleSendOtp() {
    if (!INDIAN_MOBILE.test(phone) || busy) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await sendOtp(phone);
      setStep("otp");
      setOtp(Array(OTP_LENGTH).fill(""));
      setExpiresIn(OTP_VALID_SECONDS);
      requestAnimationFrame(() => otpInputs.current[0]?.focus());
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not send OTP. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;

    setBusy(true);
    setError("");
    try {
      const result = await verifyOtp(phone, code);
      setAccessToken(result.accessToken);
      setUser(result.user.phone, result.user.role);
      router.replace(nextPath);
    } catch (requestError) {
      setError(
        errorMessage(requestError, "That OTP is incorrect or has expired."),
      );
    } finally {
      setBusy(false);
    }
  }

  function updateOtp(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setOtp((current) =>
      current.map((value, position) => (position === index ? digit : value)),
    );
    if (digit && index < OTP_LENGTH - 1) otpInputs.current[index + 1]?.focus();
  }

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
    <section className="mx-auto w-full max-w-md py-10 sm:py-16">
      <div className="mb-7 text-center">
        <Wordmark className="text-2xl" />
      </div>

      <div className="card p-5 sm:p-8">
        <div className="mb-6 flex gap-2" aria-hidden="true">
          <span className="h-1.5 flex-1 rounded-full bg-accent" />
          <span
            className={`h-1.5 flex-1 rounded-full transition ${step === "otp" ? "bg-accent" : "bg-gray-200 dark:bg-white/10"}`}
          />
        </div>

        {step === "phone" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendOtp();
            }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Smartphone className="h-5 w-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">
              Login or sign up
            </h1>

            <label
              htmlFor="phone"
              className="mt-6 block text-xs font-extrabold text-gray-600 dark:text-gray-300"
            >
              Mobile number
            </label>
            <div className="mt-1.5 flex overflow-hidden rounded-xl border border-black/10 bg-white transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 dark:border-white/15 dark:bg-white/[0.06]">
              <span className="flex items-center border-r border-black/10 bg-mist px-3.5 text-sm font-extrabold text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300">
                +91
              </span>
              <input
                id="phone"
                name="phone"
                autoComplete="tel"
                inputMode="numeric"
                autoFocus
                value={phone}
                onChange={(event) => {
                  setPhone(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, PHONE_LENGTH),
                  );
                  setError("");
                }}
                placeholder="98765 43210"
                className="min-h-12 min-w-0 flex-1 bg-transparent px-3.5 text-sm font-extrabold tracking-wide outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-300"
              />
              {INDIAN_MOBILE.test(phone) && (
                <Check className="mr-3 h-4 w-4 self-center text-accent" />
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-deal/10 px-3 py-2.5 text-xs font-bold text-deal"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length !== PHONE_LENGTH}
              className="mt-6 w-full"
            >
              Continue with OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("phone");
                setError("");
              }}
              className="-ml-3 mb-3"
            >
              <ArrowLeft className="h-4 w-4" /> Change number
            </Button>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">
              Verify your number
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter the 6-digit OTP sent to{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                +91 {phone}
              </strong>
              .
            </p>

            <div className="mt-6 grid grid-cols-6 gap-2">
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
                  className="aspect-square min-w-0 rounded-xl border border-black/10 bg-white text-center font-display text-lg font-black outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 dark:border-white/15 dark:bg-white/[0.06]"
                />
              ))}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-deal/10 px-3 py-2.5 text-xs font-bold text-deal"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={busy}
              disabled={expiresIn === 0 || otp.some((digit) => !digit)}
              className="mt-6 w-full"
            >
              Verify & continue
            </Button>

            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-gray-500">
              {expiresIn > 0 ? (
                <span>
                  OTP valid for{" "}
                  <strong className="tabular-nums text-ink dark:text-white">
                    ({formatSeconds(expiresIn)})
                  </strong>
                </span>
              ) : (
                <span className="text-deal">OTP expired</span>
              )}
              {resendIn > 0 ? (
                <span className="tabular-nums">
                  Resend in {formatSeconds(resendIn)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={busy}
                  className="font-extrabold text-accent"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

// 119 -> "1:59"
function formatSeconds(total: number) {
  const seconds = String(total % 60).padStart(2, "0");
  return `${Math.floor(total / 60)}:${seconds}`;
}
