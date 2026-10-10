const TONES = {
  green: "bg-[#C8EBD3] text-[#0F5B2E]",
  yellow: "bg-[#FFF0B8] text-[#5C4300]",
  blue: "bg-[#D6E6FF] text-[#123E8A]",
  red: "bg-[#FFD9D9] text-[#8E1B1B]",
};

export type PillTone = keyof typeof TONES;

// Rounded status label: green done/visible, yellow waiting, blue confirmed, red cancelled/hidden.
export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  return <span className={`status-pill ${TONES[tone]}`}>{label}</span>;
}
