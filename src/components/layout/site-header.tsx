"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart } from "lucide-react";
import { getCart } from "@/api/cart";
import { Wordmark } from "@/components/ui/wordmark";
import { uiText } from "@/lib/ui-text";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useUiSettings } from "@/store/ui-settings-store";
import { AccountMenu } from "./account-menu";
import { CategoryBar } from "./category-bar";
import { HeaderSettingsMenu } from "./header-settings-menu";
import { MobileSidebar } from "./mobile-sidebar";
import { SearchBox } from "./search-box";
import type { Category } from "@/lib/types";

// Top bar: menu, logo, search, account, cart and settings.
export function SiteHeader({ categories }: { categories: Category[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const language = useUiSettings((state) => state.language);
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const count = useCartStore((state) => state.count);
  const setCount = useCartStore((state) => state.setCount);

  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    if (!loggedIn) {
      setCount(0);
      return;
    }
    getCart()
      .then((cart) => setCount(cart.items.length))
      .catch(() => setCount(0));
  }, [loggedIn, setCount]);

  const searchBox = (
    <SearchBox
      label={uiText(language, "search")}
      placeholder={uiText(language, "searchPlaceholder")}
    />
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-sand bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-night/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-3 sm:gap-2 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="icon-button md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" aria-label="ApnaKart home" className="shrink-0">
            <Wordmark className="text-xl sm:text-2xl" />
          </Link>

          <div className="mx-3 hidden max-w-2xl flex-1 md:flex lg:mx-6">
            {searchBox}
          </div>
          <div className="flex-1 md:hidden" />

          <AccountMenu />

          <Link
            href="/cart"
            aria-label={`${uiText(language, "cart")}: ${count}`}
            className="relative flex h-10 items-center gap-2 rounded-full px-2 text-sm font-extrabold transition hover:bg-black/[0.05] dark:hover:bg-white/10 sm:px-3"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">{uiText(language, "cart")}</span>
            {count > 0 && (
              <span className="absolute -top-0.5 left-5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-night">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <HeaderSettingsMenu />
        </div>

        <div className="px-3 pb-3 md:hidden">{searchBox}</div>
      </header>

      <CategoryBar categories={categories} />

      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
      />
    </>
  );
}
