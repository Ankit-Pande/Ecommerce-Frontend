const TINTS = [
  "#FFE1D6",
  "#FFF0B8",
  "#D6F0FF",
  "#E6DDFF",
  "#FFD9E6",
  "#DDF5C9",
  "#CFF3EA",
  "#FFE6C2",
];

// The card tint at a position in the list (repeats every 8).
export function tintAt(index: number) {
  return TINTS[index % TINTS.length];
}

// A tint number that is always the same for the same id.
export function tintIndexFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % TINTS.length;
}

// The card tint for an id.
export function tintFor(id: string) {
  return tintAt(tintIndexFor(id));
}
