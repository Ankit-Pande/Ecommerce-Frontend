const TINTS = [
  "bg-amber-100 text-amber-900",
  "bg-pink-100 text-pink-900",
  "bg-violet-100 text-violet-900",
  "bg-sky-100 text-sky-900",
  "bg-emerald-100 text-emerald-900",
  "bg-orange-100 text-orange-900",
  "bg-rose-100 text-rose-900",
  "bg-lime-100 text-lime-900",
];

// Soft colour for the nth tile, so category lists look colourful but stay readable.
export function tint(index: number) {
  return TINTS[index % TINTS.length];
}
