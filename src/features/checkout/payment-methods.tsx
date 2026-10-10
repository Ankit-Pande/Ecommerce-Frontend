const PAYMENTS = [
  { id: "gpay", name: "Google Pay", note: "UPI", abbr: "G", chip: "#1A56C4" },
  { id: "phonepe", name: "PhonePe", note: "UPI", abbr: "Pe", chip: "#5B2A9D" },
  { id: "paytm", name: "Paytm", note: "UPI", abbr: "P", chip: "#0B5FA5" },
  {
    id: "upi",
    name: "Other UPI ID",
    note: "BHIM and any UPI app",
    abbr: "@",
    chip: "#0F6B4A",
  },
  {
    id: "card",
    name: "Credit / Debit card",
    note: "Visa, Mastercard, RuPay",
    abbr: "▭",
    chip: "#8A3B00",
  },
  {
    id: "nb",
    name: "Net banking",
    note: "All Indian banks",
    abbr: "₹",
    chip: "#3B3F8C",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    note: "Pay when the order arrives",
    abbr: "COD",
    chip: "#2B2B2B",
  },
] as const;

export type PaymentChoice = (typeof PAYMENTS)[number]["id"];

// Payment method list with a radio dot and a coloured app chip.
export function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentChoice;
  onChange: (value: PaymentChoice) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2"
      role="radiogroup"
      aria-label="Payment method"
    >
      {PAYMENTS.map((method) => {
        const active = method.id === value;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(method.id)}
            className={`flex min-h-[60px] items-center gap-3 rounded-[14px] border-2 bg-white px-3 py-2 text-left ${active ? "border-accent" : "border-line"}`}
          >
            <span
              className={`h-5 w-5 shrink-0 rounded-full border-2 shadow-[inset_0_0_0_3px_#fff] ${active ? "border-accent bg-accent" : "border-line bg-white"}`}
            />
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white"
              style={{ background: method.chip }}
            >
              {method.abbr}
            </span>
            <span className="flex-1">
              <span className="block font-extrabold">{method.name}</span>
              <span className="block text-sm text-muted">{method.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Shows only the chosen payment type in the Razorpay window.
export function razorpayDisplay(choice: PaymentChoice) {
  const method =
    choice === "card" ? "card" : choice === "nb" ? "netbanking" : "upi";
  return {
    blocks: { payment: { name: "Pay using", instruments: [{ method }] } },
    sequence: ["block.payment"],
    preferences: { show_default_blocks: false },
  };
}
