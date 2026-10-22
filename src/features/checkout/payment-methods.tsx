"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import type { RazorpayMethod } from "@/lib/razorpay";

export type PaymentChoice =
  "gpay" | "phonepe" | "paytm" | "upi" | "card" | "netbanking" | "cod";

const METHODS: Record<
  PaymentChoice,
  { name: string; note: string; badge: string; color: string }
> = {
  gpay: { name: "Google Pay", note: "UPI", badge: "G", color: "#1A56C4" },
  phonepe: { name: "PhonePe", note: "UPI", badge: "Pe", color: "#5B2A9D" },
  paytm: {
    name: "Paytm",
    note: "UPI and wallet",
    badge: "P",
    color: "#0B5FA5",
  },
  upi: {
    name: "Other UPI ID",
    note: "BHIM and any UPI app",
    badge: "@",
    color: "#0F6B4A",
  },
  card: {
    name: "Credit / Debit card",
    note: "Visa, Mastercard, RuPay",
    badge: "▭",
    color: "#8A3B00",
  },
  netbanking: {
    name: "Net banking",
    note: "All Indian banks",
    badge: "₹",
    color: "#3B3F8C",
  },
  cod: {
    name: "Cash on Delivery",
    note: "Pay when the order arrives",
    badge: "COD",
    color: "#2B2B2B",
  },
};

const GROUPS: {
  id: string;
  title: string;
  note: string;
  badge: string;
  color: string;
  methods: PaymentChoice[];
}[] = [
  {
    id: "upi",
    title: "UPI",
    note: "Google Pay, PhonePe, Paytm or any UPI ID",
    badge: "UPI",
    color: "#1A56C4",
    methods: ["gpay", "phonepe", "paytm", "upi"],
  },
  {
    id: "card",
    title: "Credit / Debit card and net banking",
    note: "Visa, Mastercard, RuPay, all Indian banks",
    badge: "▭",
    color: "#8A3B00",
    methods: ["card", "netbanking"],
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    note: "Pay when the order arrives",
    badge: "₹",
    color: "#2B2B2B",
    methods: ["cod"],
  },
];

// The name of a payment choice ("Google Pay", "Cash on Delivery"…).
export function paymentName(choice: PaymentChoice) {
  return METHODS[choice].name;
}

// Which Razorpay method opens first for a payment choice.
export function razorpayMethod(choice: PaymentChoice): RazorpayMethod {
  if (choice === "card") return "card";
  if (choice === "netbanking") return "netbanking";
  return "upi";
}

// List of payment choices (UPI apps, card, net banking, COD).
export function PaymentMethods({
  value,
  totalPaise,
  onChange,
}: {
  value: PaymentChoice;
  totalPaise: number;
  onChange: (choice: PaymentChoice) => void;
}) {
  const [openGroup, setOpenGroup] = useState(
    () => GROUPS.find((group) => group.methods.includes(value))?.id ?? "",
  );

  return (
    <div className="flex flex-col gap-3">
      {GROUPS.map((group) => {
        const selected = group.methods.includes(value);
        const open = openGroup === group.id;
        return (
          <div
            key={group.id}
            className={`overflow-hidden rounded-[20px] border-2 ${selected ? "border-accent" : "border-line"}`}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpenGroup(open ? "" : group.id);
                if (!selected) onChange(group.methods[0]);
              }}
              className={`flex min-h-[68px] w-full items-center gap-3 px-3.5 py-2.5 text-left ${selected ? "bg-soft" : "bg-white"}`}
            >
              <RadioDot on={selected} />
              <Badge text={group.badge} color={group.color} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">
                  {group.title}
                </span>
                <span className="block text-sm text-muted">{group.note}</span>
              </span>
              <span aria-hidden className="text-2xl font-semibold">
                {open ? "−" : "+"}
              </span>
            </button>

            {open && (
              <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-1">
                {group.id === "cod" ? (
                  <p className="rounded-xl bg-sunny-light px-3.5 py-3 font-semibold">
                    Pay {inr(totalPaise)} in cash or UPI when the order is
                    delivered.
                  </p>
                ) : (
                  <>
                    <div
                      role="radiogroup"
                      aria-label={group.title}
                      className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5"
                    >
                      {group.methods.map((choice) => {
                        const method = METHODS[choice];
                        const on = choice === value;
                        return (
                          <button
                            key={choice}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onChange(choice)}
                            className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left ${on ? "border-accent bg-soft" : "border-line bg-white"}`}
                          >
                            <Badge text={method.badge} color={method.color} />
                            <span className="min-w-0 flex-1">
                              <span className="block font-extrabold">
                                {method.name}
                              </span>
                              <span className="block text-sm text-muted">
                                {method.note}
                              </span>
                            </span>
                            <RadioDot on={on} />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm font-semibold text-muted">
                      You will complete the payment in the secure Razorpay
                      window.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// The round "selected" mark of a payment choice.
function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[22px] w-[22px] shrink-0 rounded-full border-2 shadow-[inset_0_0_0_3px_#fff] ${on ? "border-accent bg-accent" : "border-line bg-white"}`}
    />
  );
}

// Coloured short badge of a payment method ("G", "Pe", "COD").
function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-sm font-extrabold text-white"
      style={{ background: color }}
    >
      {text}
    </span>
  );
}
