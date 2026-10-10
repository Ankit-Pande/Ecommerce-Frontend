"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { logoutSession } from "@/api/http";
import { useClickOutside } from "@/hooks/use-click-outside";
import { isAdmin, useAuthStore } from "@/store/auth-store";

const itemClass =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-gray-600 transition hover:bg-mist hover:text-ink dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white";

// Login link for guests, account dropdown for logged-in users.
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);
  const pathname = usePathname();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const phone = useAuthStore((state) => state.phone);
  const role = useAuthStore((state) => state.role);

  useEffect(close, [pathname, close]);

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-extrabold transition hover:bg-black/[0.05] dark:hover:bg-white/10 sm:px-3"
      >
        <UserRound className="h-5 w-5" />
        <span className="hidden sm:inline">Login</span>
      </Link>
    );
  }

  const links = [
    ...(isAdmin(role)
      ? [
          {
            href: "/admin",
            label: "Admin panel",
            icon: LayoutDashboard,
          },
        ]
      : []),
    { href: "/account", label: "My profile", icon: UserRound },
    { href: "/orders", label: "My orders", icon: Package },
    {
      href: "/account#addresses",
      label: "Saved addresses",
      icon: MapPin,
    },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Your account"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-full px-1.5 transition hover:bg-black/[0.05] dark:hover:bg-white/10"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
          <UserRound className="h-4 w-4" />
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-sand bg-white py-2 shadow-2xl dark:border-white/10 dark:bg-chrome">
          <p className="border-b border-sand px-4 pb-3 pt-2 text-sm font-extrabold dark:border-white/10">
            +91 {phone}
          </p>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={itemClass}>
              <Icon className="h-4 w-4 text-accent" /> {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => void logoutSession()}
            className={`${itemClass} border-t border-sand text-deal dark:border-white/10`}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
