const TONES = {
  good: "bg-[#C8EBD3] text-[#0F5B2E]",
  warn: "bg-[#FFF0B8] text-[#5C4300]",
  info: "bg-[#D6E6FF] text-[#123E8A]",
  bad: "bg-[#FFD9D9] text-[#8E1B1B]",
};

export type PillTone = keyof typeof TONES;

// Coloured status label (good, warn, info, bad).
export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  return <span className={`status-pill ${TONES[tone]}`}>{label}</span>;
}
