"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, MessageSquareLock } from "lucide-react";
import { sendOtp, verifyOtp } from "@/api/auth";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { Wordmark } from "@/components/ui/wordmark";

const OTP_LENGTH = 6;
const PHONE_LENGTH = 10;
const OTP_VALID_SECONDS = 120;
const RESEND_AFTER_SECONDS = 60;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

// Phone and OTP login form.
export function LoginForm() {
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

  // Sends the OTP and starts the timers.
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

  // Checks the OTP and logs in.
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

  // Updates one OTP digit and moves focus.
  function updateOtp(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setOtp((current) =>
      current.map((value, position) => (position === index ? digit : value)),
    );
    if (digit && index < OTP_LENGTH - 1) otpInputs.current[index + 1]?.focus();
  }

  // Backspace moves to the previous box.
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
    <section className="mx-auto grid w-full max-w-md overflow-hidden py-8 sm:py-14 lg:max-w-5xl lg:grid-cols-2 lg:py-12">
      <div className="relative hidden overflow-hidden rounded-l-3xl bg-gradient-to-br from-accent via-violet-600 to-deal p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <span className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10" />
        <Wordmark onDark className="relative text-2xl" />
        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Shop smarter, pay your way.
          </h2>
          <ul className="mt-6 space-y-3 text-sm font-semibold text-white/90">
            <li>✓ 8,000+ products across 15 categories</li>
            <li>✓ UPI, cards or cash on delivery</li>
            <li>✓ Free delivery on every order</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/70">
          No password needed — just your mobile number.
        </p>
      </div>
      <div className="card px-5 py-8 sm:px-9 sm:py-10 lg:rounded-l-none lg:rounded-r-3xl lg:px-12 lg:py-14">
        {step === "phone" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendOtp();
            }}
          >
            <div className="text-center">
              <Wordmark className="text-2xl lg:hidden" />
              <h1 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Login or create an account with your mobile number
              </p>
            </div>

            <label
              htmlFor="phone"
              className="mt-8 block text-sm font-semibold text-gray-600 dark:text-gray-300"
            >
              Mobile number
            </label>
            <div className="mt-2 flex h-12 items-center rounded-full border border-sand bg-white px-1.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 dark:border-white/15 dark:bg-white/[0.06]">
              <span className="grid h-9 place-items-center rounded-full bg-mist px-3 text-sm font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
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
                className="min-w-0 flex-1 bg-transparent px-3 text-base font-semibold tracking-wide outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {INDIAN_MOBILE.test(phone) && (
                <Check className="mr-3 h-4 w-4 text-leaf" />
              )}
            </div>

            {error && <ErrorText message={error} />}
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length !== PHONE_LENGTH}
              className="mt-7 h-12 w-full text-base"
            >
              Get OTP
            </Button>
            <p className="mt-5 text-center text-xs text-gray-500">
              New here? An account is created after OTP verification.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
              }}
              aria-label="Change number"
              className="icon-button -ml-2 -mt-2 bg-mist dark:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-accent/15">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white">
                  <MessageSquareLock className="h-7 w-7" />
                </span>
              </span>
              <h1 className="mt-6 font-display text-2xl font-bold">
                Verification code
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter the 6-digit code sent to{" "}
                <strong className="text-ink dark:text-gray-200">
                  +91 {phone}
                </strong>
              </p>
            </div>

            <div className="mx-auto mt-7 grid max-w-xs grid-cols-6 gap-2">
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
                  className={`aspect-square min-w-0 rounded-full border text-center text-lg font-bold outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 focus-visible:ring-offset-0 ${digit ? "border-accent bg-accent text-white" : "border-sand bg-white dark:border-white/15 dark:bg-white/[0.06]"}`}
                />
              ))}
            </div>

            {error && <ErrorText message={error} />}
            <Button
              type="submit"
              loading={busy}
              disabled={expiresIn === 0 || otp.some((digit) => !digit)}
              className="mt-7 h-12 w-full text-base"
            >
              Verify &amp; continue
            </Button>

            <div className="mt-5 text-center text-sm text-gray-500">
              {expiresIn > 0 ? (
                <p>
                  Code valid for{" "}
                  <strong className="tabular-nums text-ink dark:text-white">
                    ({formatSeconds(expiresIn)})
                  </strong>
                </p>
              ) : (
                <p className="font-semibold text-deal">Code expired</p>
              )}
              <p className="mt-1.5">
                Didn&apos;t receive the code?{" "}
                {resendIn > 0 ? (
                  <span className="tabular-nums">
                    Resend in {formatSeconds(resendIn)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={busy}
                    className="font-bold text-accent"
                  >
                    Resend
                  </button>
                )}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

// Red error message.
function ErrorText({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-2xl bg-deal/10 px-4 py-2.5 text-center text-sm font-semibold text-deal"
    >
      {message}
    </p>
  );
}

// 119 to "1:59".
function formatSeconds(total: number) {
  const seconds = String(total % 60).padStart(2, "0");
  return `${Math.floor(total / 60)}:${seconds}`;
}
