"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo-icon";
import { useUiStore } from "@/store/ui-store";

const AssistantPanel = dynamic(
  () => import("./assistant-panel").then((module) => module.AssistantPanel),
  { ssr: false },
);

const PAGES_WITHOUT_BUTTON = ["/cart", "/checkout", "/order-placed"];

// The round assistant button; opens the chat panel (loaded only when first opened).
export function AssistantWidget() {
  const pathname = usePathname();
  const open = useUiStore((state) => state.chatOpen);
  const setOpen = useUiStore((state) => state.setChatOpen);

  if (open) {
    return (
      <div className="fixed bottom-4 right-4 z-30 w-[min(420px,calc(100vw-32px))]">
        <AssistantPanel onClose={() => setOpen(false)} />
      </div>
    );
  }

  if (PAGES_WITHOUT_BUTTON.includes(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open ApnaKart AI"
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2"
    >
      <span className="rounded-[18px_18px_4px_18px] bg-white px-3.5 py-2 font-extrabold shadow-[0_6px_18px_rgba(15,42,46,.25)] max-sm:hidden">
        Ask ApnaKart AI
      </span>
      <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-4 border-white bg-sunny shadow-[0_10px_28px_rgba(15,42,46,.4)]">
        <LogoIcon size={44} />
      </span>
    </button>
  );
}
