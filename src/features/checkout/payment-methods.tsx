import { Banknote, Check, CreditCard, Smartphone } from "lucide-react";

export type PaymentChoice = "UPI" | "CARD" | "COD";

const choices = [
  {
    value: "COD",
    icon: Banknote,
    title: "Cash on delivery",
    detail: "Pay in cash or UPI when the order arrives",
    badges: [{ label: "Cash", className: "bg-emerald-100 text-emerald-700" }],
  },
  {
    value: "UPI",
    icon: Smartphone,
    title: "UPI apps",
    detail: "Pay instantly from any UPI app",
    badges: [
      { label: "G Pay", className: "bg-blue-50 text-blue-600" },
      { label: "PhonePe", className: "bg-violet-600 text-white" },
      { label: "Paytm", className: "bg-sky-500 text-white" },
    ],
  },
  {
    value: "CARD",
    icon: CreditCard,
    title: "Cards & netbanking",
    detail: "Debit card, credit card or netbanking",
    badges: [
      { label: "VISA", className: "bg-blue-900 text-white" },
      { label: "Mastercard", className: "bg-orange-100 text-orange-700" },
      { label: "RuPay", className: "bg-emerald-50 text-emerald-700" },
    ],
  },
] as const;

// Cash on delivery, UPI and card choices with app badges.
export function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentChoice;
  onChange: (value: PaymentChoice) => void;
}) {
  return (
    <div className="grid gap-3">
      {choices.map((choice) => {
        const active = value === choice.value;
        const Icon = choice.icon;

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            aria-pressed={active}
            className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition sm:p-4 ${active ? "border-accent bg-accent/[0.03] shadow-card" : "border-line hover:border-accent/30"}`}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-accent bg-accent text-white" : "border-gray-300"}`}
            >
              {active && <Check className="h-3 w-3" />}
            </span>
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-accent text-white" : "bg-ground text-gray-500"}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">
                {choice.title}
              </span>
              <span className="block text-xs text-gray-500">
                {choice.detail}
              </span>
            </span>
            <span className="hidden flex-wrap justify-end gap-1 sm:flex">
              {choice.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
