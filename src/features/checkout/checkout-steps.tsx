import { Check } from "lucide-react";

const STEPS = ["Cart", "Address & payment", "Confirmation"];

export function CheckoutSteps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;

        return (
          <li
            key={label}
            className={`flex items-center ${number < STEPS.length ? "flex-1" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${complete || active ? "bg-accent text-white" : "bg-gray-200 text-gray-500 dark:bg-white/10"}`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : number}
              </span>
              <span
                className={`hidden whitespace-nowrap text-xs font-extrabold sm:block ${active ? "text-accent" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {number < STEPS.length && (
              <span
                className={`mx-2 h-px flex-1 sm:mx-4 ${complete ? "bg-accent" : "bg-gray-200 dark:bg-white/10"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
