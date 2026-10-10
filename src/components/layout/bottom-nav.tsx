"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

// Bottom tab bar on phones.
export function BottomNav() {
  const pathname = usePathname();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const count = useCartStore((state) => state.count);

  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/products",
      label: "Shop",
      icon: LayoutGrid,
      active: pathname.startsWith("/products"),
    },
    {
      href: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      active: pathname === "/cart" || pathname === "/checkout",
    },
    {
      href: loggedIn ? "/account" : "/login",
      label: loggedIn ? "Account" : "Login",
      icon: UserRound,
      active: ["/account", "/orders", "/login"].includes(pathname),
    },
  ];

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-full bg-white p-1.5 shadow-soft ring-1 ring-black/5 dark:bg-chrome dark:ring-white/10 md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={`relative flex h-11 items-center justify-center gap-2 rounded-full text-xs font-bold transition ${
            active
              ? "bg-accent px-4 text-white"
              : "w-11 text-gray-500 hover:text-ink dark:text-gray-300"
          }`}
        >
          <Icon className="h-5 w-5" />
          {active && <span>{label}</span>}
          {href === "/cart" && count > 0 && !active && (
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
