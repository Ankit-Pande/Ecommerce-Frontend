"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo-icon";
import { categoryHref } from "@/lib/links";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import { useUiStore } from "@/store/ui-store";
import type { Category } from "@/lib/types";

const PAYMENT_CHIPS = [
  "UPI",
  "Google Pay",
  "PhonePe",
  "Paytm",
  "Visa",
  "Mastercard",
  "RuPay",
  "Net banking",
  "Cash on Delivery",
];

const LINK = "flex min-h-10 items-center text-left";

// Footer: customer care, top categories, help links and payment methods.
export function SiteFooter({ categories }: { categories: Category[] }) {
  const setChatOpen = useUiStore((state) => state.setChatOpen);

  return (
    <footer className="mt-8 rounded-t-[36px] bg-ink px-5 pb-24 pt-9 text-white">
      <div className="mx-auto flex max-w-page flex-wrap gap-8">
        <div className="flex flex-[2_1_260px] flex-col items-start gap-3.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[28px] font-extrabold"
          >
            <LogoIcon
              size={44}
              tile="fill-mint"
              line="#0F2A2E"
              wheels="#0F2A2E"
            />
            ApnaKart
          </Link>
          <div className="flex flex-col gap-1 rounded-[18px] bg-ink-2 px-4 py-3.5">
            <span className="font-extrabold text-mint">Customer care</span>
            <a href={`tel:+91${SUPPORT_PHONE}`}>+91 {SUPPORT_PHONE}</a>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-[1_1_150px] flex-col">
            <p className="pb-1 text-lg font-extrabold text-mint">Categories</p>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={categoryHref(category.slug)}
                className={LINK}
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-[1_1_150px] flex-col">
          <p className="pb-1 text-lg font-extrabold text-sunny">Help</p>
          <Link href="/orders" className={LINK}>
            Track order
          </Link>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className={LINK}
          >
            Ask the assistant
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-page flex-wrap items-center gap-2 border-t border-[#35555A] pt-4">
        <span className="mr-1 font-semibold">We accept</span>
        {PAYMENT_CHIPS.map((name) => (
          <span
            key={name}
            className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-ink"
          >
            {name}
          </span>
        ))}
        <span className="ml-auto">© {new Date().getFullYear()} ApnaKart</span>
      </div>
    </footer>
  );
}
