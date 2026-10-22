const STEPS = ["Cart", "Address", "Payment", "Done"];

// Cart → Address → Payment → Done progress bar.
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol
      aria-label="Checkout steps"
      className="flex items-center gap-1.5 overflow-x-auto rounded-full bg-white px-3 py-2 shadow-card"
    >
      {STEPS.map((name, index) => (
        <li
          key={name}
          aria-current={index === current ? "step" : undefined}
          className="flex flex-[1_0_auto] items-center gap-2"
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold ${index <= current ? "border-accent bg-accent text-white" : "border-line bg-white"}`}
          >
            {index + 1}
          </span>
          <span
            className={index === current ? "font-extrabold" : "font-semibold"}
          >
            {name}
          </span>
          {index < STEPS.length - 1 && (
            <span
              className={`h-[3px] min-w-4 flex-1 rounded-full ${index < current ? "bg-accent" : "bg-line"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
