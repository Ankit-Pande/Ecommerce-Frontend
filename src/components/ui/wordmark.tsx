import { ShoppingBag } from "lucide-react";

// ApnaKart logo and name.
export function Wordmark({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}
    >
      <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-[0.45em] bg-chrome text-white dark:bg-accent">
        <ShoppingBag className="h-[0.9em] w-[0.9em]" strokeWidth={2.5} />
      </span>
      <span>
        Apna
        <span className={onDark ? "text-sky-300" : "text-accent"}>Kart</span>
      </span>
    </span>
  );
}
