import { Banknote, Check, CreditCard, Smartphone } from "lucide-react";

export type PaymentChoice = "UPI" | "CARD" | "COD";

const choices = [
  {
    value: "UPI",
    icon: Smartphone,
    title: "UPI apps",
    detail: "Google Pay, PhonePe or any UPI app",
  },
  {
    value: "CARD",
    icon: CreditCard,
    title: "Cards & banking",
    detail: "Debit card, credit card or netbanking",
  },
  {
    value: "COD",
    icon: Banknote,
    title: "Cash on delivery",
    detail: "Pay when the order arrives",
  },
] as const;

export function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentChoice;
  onChange: (value: PaymentChoice) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {choices.map((choice) => {
        const active = value === choice.value;
        const Icon = choice.icon;

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            aria-pressed={active}
            className={`relative flex min-h-32 flex-col rounded-2xl border-2 bg-white p-4 text-left transition dark:bg-white/[0.04] ${active ? "border-accent shadow-card" : "border-sand hover:border-accent/25 dark:border-white/10"}`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-accent text-white" : "bg-mist text-gray-500 dark:bg-white/10"}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-extrabold">{choice.title}</span>
            <span className="mt-1 text-[11px] leading-4 text-gray-500">
              {choice.detail}
            </span>
            <span
              className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border ${active ? "border-accent bg-accent text-white" : "border-gray-300"}`}
            >
              {active && <Check className="h-3 w-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
