"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useToastStore } from "@/store/toast-store";

// Shows the toast messages; a tap hides one.
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[70] flex w-[calc(100vw-32px)] max-w-sm -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((item) => {
        const Icon = item.type === "success" ? CheckCircle2 : XCircle;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => remove(item.id)}
            className={`animate-toast-in flex items-start gap-2.5 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-white shadow-2xl ${item.type === "success" ? "bg-accent" : "bg-danger"}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {item.message}
          </button>
        );
      })}
    </div>
  );
}
