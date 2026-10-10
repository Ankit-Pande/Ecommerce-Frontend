"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getCart } from "@/api/cart";
import { SafeImage } from "@/components/ui/safe-image";
import { catalogHref } from "@/lib/format";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { ACCENTS, useUiStore, type Accent } from "@/store/ui-store";
import { SearchBox } from "./search-box";
import type { Category } from "@/lib/types";

const TEXT = {
  en: {
    search: "Search",
    placeholder: "Search products and categories",
    orders: "Orders",
    profile: "Profile",
    admin: "Admin",
    login: "Login",
    cart: "Cart",
  },
  hi: {
    search: "खोजें",
    placeholder: "प्रोडक्ट और कैटेगरी खोजें",
    orders: "ऑर्डर",
    profile: "प्रोफाइल",
    admin: "एडमिन",
    login: "लॉगिन",
    cart: "कार्ट",
  },
};

// Top bar: logo, search, language, theme colours, account links, cart; then the category strip.
export function SiteHeader({ categories }: { categories: Category[] }) {
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const role = useAuthStore((state) => state.role);
  const count = useCartStore((state) => state.count);
  const setCount = useCartStore((state) => state.setCount);
  const { accent, language, setAccent, toggleLanguage } = useUiStore();
  const text = TEXT[language];

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
      <header className="flex flex-wrap items-center gap-3 bg-white px-6 py-3 shadow-bar">
        <Link
          href="/"
          className="flex min-h-11 items-center text-[28px] font-extrabold text-accent"
        >
          ApnaKart
        </Link>
        <SearchBox
          label={text.search}
          placeholder={text.placeholder}
          className="flex-[1_1_300px] bg-ground"
        />
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label="Language"
          className="min-h-11 rounded-xl border border-line bg-white px-3.5 font-semibold"
        >
          EN / हिं
        </button>
        <div className="flex gap-1.5">
          {(Object.keys(ACCENTS) as Accent[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccent(color)}
              aria-label={`Theme colour ${color}`}
              style={{
                background: color,
                outline: `3px solid ${color === accent ? color : "transparent"}`,
              }}
              className="my-2 h-7 w-7 rounded-full outline-offset-2"
            />
          ))}
        </div>
        <Link href="/orders" className="btn-ghost px-2">
          {text.orders}
        </Link>
        <Link href="/account" className="btn-ghost px-2">
          {text.profile}
        </Link>
        {isAdmin(role) && (
          <Link href="/admin" className="btn-ghost px-2">
            {text.admin}
          </Link>
        )}
        {!loggedIn && (
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-xl border border-accent bg-white px-4 font-semibold text-accent"
          >
            {text.login}
          </Link>
        )}
        <Link
          href="/cart"
          className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-[18px] font-semibold text-white"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          {text.cart} ({count})
        </Link>
      </header>
      <Suspense
        fallback={<CategoryStrip categories={categories} active={null} />}
      >
        <ActiveCategoryStrip categories={categories} />
      </Suspense>
    </>
  );
}

// Category strip that knows which category page is open.
function ActiveCategoryStrip({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname === "/products" ? params.get("category") : null;
  return <CategoryStrip categories={categories} active={active} />;
}

// Accent strip with one pill per category; the open category is white.
function CategoryStrip({
  categories,
  active,
}: {
  categories: Category[];
  active: string | null;
}) {
  return (
    <nav
      aria-label="Categories"
      className="flex gap-2 overflow-x-auto bg-accent px-6 py-2.5"
    >
      {categories.map((category) => {
        const on = category.slug === active;
        return (
          <Link
            key={category.id}
            href={catalogHref(category)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-4 font-semibold ${on ? "bg-white text-ink" : "text-white"}`}
          >
            <span className="relative h-9 w-9 overflow-hidden rounded-full bg-white">
              <SafeImage
                src={category.image}
                alt=""
                sizes="36px"
                className="object-cover"
              />
            </span>
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
