"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Check,
  HelpCircle,
  Languages,
  Moon,
  MoreVertical,
  Palette,
  Settings,
  Sun,
} from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { uiText } from "@/lib/ui-text";
import { useUiSettings, type AppColor } from "@/store/ui-settings-store";

const colors: { value: AppColor; label: string; className: string }[] = [
  { value: "slate", label: "Slate", className: "bg-[#3F5F8F]" },
  { value: "teal", label: "Teal", className: "bg-[#236F70]" },
  { value: "purple", label: "Purple", className: "bg-[#6B4E9B]" },
  { value: "orange", label: "Orange", className: "bg-[#D65C1C]" },
];

export function HeaderSettingsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setOpen(false), []),
  );
  const language = useUiSettings((state) => state.language);
  const color = useUiSettings((state) => state.color);
  const setLanguage = useUiSettings((state) => state.setLanguage);
  const setColor = useUiSettings((state) => state.setColor);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open settings"
        aria-expanded={open}
        className="icon-button"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-sand bg-white shadow-2xl dark:border-white/10 dark:bg-chrome">
          <div className="flex items-center gap-2 border-b border-sand px-4 py-3.5 dark:border-white/10">
            <Settings className="h-4 w-4 text-accent" />
            <p className="text-sm font-extrabold">
              {uiText(language, "settings")}
            </p>
          </div>

          <div className="space-y-5 p-4">
            <fieldset>
              <legend className="mb-2 flex items-center gap-2 text-xs font-extrabold text-gray-600 dark:text-gray-300">
                <Languages className="h-4 w-4 text-accent" />{" "}
                {uiText(language, "language")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceButton
                  active={language === "en"}
                  onClick={() => setLanguage("en")}
                  label="English"
                />
                <ChoiceButton
                  active={language === "hi"}
                  onClick={() => setLanguage("hi")}
                  label="हिन्दी"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 flex items-center gap-2 text-xs font-extrabold text-gray-600 dark:text-gray-300">
                {resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4 text-accent" />
                ) : (
                  <Sun className="h-4 w-4 text-accent" />
                )}
                {uiText(language, "theme")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceButton
                  active={resolvedTheme === "light"}
                  onClick={() => setTheme("light")}
                  label={uiText(language, "light")}
                />
                <ChoiceButton
                  active={resolvedTheme === "dark"}
                  onClick={() => setTheme("dark")}
                  label={uiText(language, "dark")}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 flex items-center gap-2 text-xs font-extrabold text-gray-600 dark:text-gray-300">
                <Palette className="h-4 w-4 text-accent" />{" "}
                {uiText(language, "appColor")}
              </legend>
              <div className="flex gap-2">
                {colors.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setColor(item.value)}
                    aria-label={`${item.label} app color`}
                    aria-pressed={color === item.value}
                    className={`grid h-10 flex-1 place-items-center rounded-xl border-2 transition ${color === item.value ? "border-gray-800 dark:border-white" : "border-transparent bg-gray-50 dark:bg-white/[0.05]"}`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-white ${item.className}`}
                    >
                      {color === item.value && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <Link
            href="mailto:support@apnakart.in"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-t border-sand px-4 py-3.5 text-sm font-bold text-gray-600 hover:bg-mist dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <HelpCircle className="h-4 w-4 text-accent" />{" "}
            {uiText(language, "help")}
          </Link>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-black/10 text-gray-500 dark:border-white/15"
      }`}
    >
      {label}
    </button>
  );
}
