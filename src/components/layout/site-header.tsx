"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, Truck } from "lucide-react";
import { getCart } from "@/api/cart";
import { Wordmark } from "@/components/ui/wordmark";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { AccountMenu } from "@/components/layout/account-menu";
import { CategoryBar } from "@/components/layout/category-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SearchBox } from "@/components/layout/search-box";
import type { Category } from "@/lib/types";

// Top bar: menu, logo, search, account, cart and theme.
export function SiteHeader({ categories }: { categories: Category[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
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

  return (
    <>
      <div className="bg-gradient-to-r from-accent via-accent-dark to-accent px-3 py-1.5 text-center text-[11px] font-semibold text-white sm:text-xs">
        <Truck className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
        Free delivery on every order
        <span className="hidden sm:inline"> · Cash on delivery available</span>
        {" · "}
        <Link
          href="/products?discount=true"
          className="font-extrabold underline"
        >
          Shop offers
        </Link>
      </div>
      <header className="sticky top-0 z-40 border-b border-sand bg-white dark:border-white/10 dark:bg-night">
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
            <SearchBox />
          </div>
          <div className="flex-1 md:hidden" />

          <AccountMenu />

          <Link
            href="/cart"
            aria-label={`$Cart: ${count}`}
            className="relative flex h-10 items-center gap-2 rounded-full px-2 text-sm font-extrabold transition hover:bg-black/[0.05] dark:hover:bg-white/10 sm:px-3"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-0.5 left-5 grid h-5 min-w-5 place-items-center rounded-full bg-deal px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-night">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <ThemeToggle />
        </div>

        <div className="px-3 pb-3 md:hidden">
          <SearchBox />
        </div>
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
