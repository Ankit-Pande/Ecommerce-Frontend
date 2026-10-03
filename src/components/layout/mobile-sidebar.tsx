"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Grid3X3,
  Home,
  LayoutDashboard,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Wordmark } from "@/components/ui/wordmark";
import { catalogHref } from "@/lib/catalog-fallback";
import { uiText, type UiTextKey } from "@/lib/ui-text";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { useUiSettings } from "@/store/ui-settings-store";
import type { Category } from "@/lib/types";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
};

const primaryLink =
  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-gray-700 transition hover:bg-mist hover:text-accent dark:text-gray-200 dark:hover:bg-white/10";

export function MobileSidebar({
  open,
  onClose,
  categories,
}: MobileSidebarProps) {
  const role = useAuthStore((state) => state.role);
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const language = useUiSettings((state) => state.language);
  const text = (key: UiTextKey) => uiText(language, key);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-night ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-4 dark:border-white/10">
          <Link href="/" onClick={onClose}>
            <Wordmark className="text-2xl" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="icon-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loggedIn && isAdmin(role) && (
          <div className="px-3 pt-3">
            <Link
              href="/admin"
              onClick={onClose}
              className="flex min-h-12 items-center gap-3 rounded-xl bg-accent px-4 text-sm font-extrabold text-white shadow-button"
            >
              <LayoutDashboard className="h-4 w-4" /> {text("admin")}
            </Link>
          </div>
        )}

        <div className="border-b border-sand p-3 dark:border-white/10">
          <nav className="grid grid-cols-2 gap-1" aria-label="Main links">
            <Link href="/" onClick={onClose} className={primaryLink}>
              <Home className="h-4 w-4 text-accent" /> {text("home")}
            </Link>
            <Link href="/products" onClick={onClose} className={primaryLink}>
              <ShoppingBag className="h-4 w-4 text-accent" /> {text("shop")}
            </Link>
            <Link
              href={loggedIn ? "/account" : "/login"}
              onClick={onClose}
              className={primaryLink}
            >
              <UserRound className="h-4 w-4 text-accent" />{" "}
              {loggedIn ? text("account") : text("login")}
            </Link>
            <Link href="/orders" onClick={onClose} className={primaryLink}>
              <Package className="h-4 w-4 text-accent" /> {text("orders")}
            </Link>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Grid3X3 className="h-4 w-4 text-accent" />
            <p className="eyebrow">{text("category")}</p>
          </div>

          {categories.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]"
                />
              ))}
            </div>
          ) : (
            <nav className="space-y-1" aria-label="Categories">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border-b border-sand py-2 last:border-0 dark:border-white/10"
                >
                  <Link
                    href={catalogHref(category)}
                    onClick={onClose}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-extrabold hover:bg-mist dark:hover:bg-white/10"
                  >
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-mist text-gray-400 dark:bg-white/10">
                      <SafeImage
                        src={category.image}
                        alt=""
                        sizes="36px"
                        className="rounded-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {category.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                  {category.children.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-2 pl-14 pr-2 pb-1">
                      {category.children.slice(0, 8).map((child) => (
                        <Link
                          key={child.id}
                          href={catalogHref(child, "subcategory")}
                          onClick={onClose}
                          className="truncate rounded-lg py-2 text-xs font-medium text-gray-500 hover:text-accent dark:text-gray-400"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>
      </aside>
    </div>
  );
}
