"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Package,
  Search,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getCart } from "@/api/cart";
import { LogoIcon } from "@/components/ui/logo-icon";
import { SafeImage } from "@/components/ui/safe-image";
import { useActiveCategory } from "@/hooks/use-active-category";
import { tintAt } from "@/lib/colors";
import { categoryHref } from "@/lib/links";
import { isAdmin, useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { ACCENTS, useUiStore, type Accent } from "@/store/ui-store";
import type { Category } from "@/lib/types";

const TEXT = {
  en: {
    theme: "Theme",
    track: "Track order",
    admin: "Admin",
    menu: "Categories menu",
    search: "Search products and categories",
    login: "Login",
    account: "Account",
    orders: "Orders",
    cart: "Cart",
  },
  hi: {
    theme: "थीम",
    track: "ऑर्डर ट्रैक करें",
    admin: "एडमिन",
    menu: "कैटेगरी मेन्यू",
    search: "प्रोडक्ट और कैटेगरी खोजें",
    login: "लॉगिन",
    account: "अकाउंट",
    orders: "ऑर्डर",
    cart: "कार्ट",
  },
};

// Top bar (language, theme, track order), header with search, account and cart, and the category band.
export function SiteHeader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const role = useAuthStore((state) => state.role);
  const count = useCartStore((state) => state.count);
  const updateCount = useCartStore((state) => state.updateCount);
  const accent = useUiStore((state) => state.accent);
  const language = useUiStore((state) => state.language);
  const text = TEXT[language];

  useEffect(() => {
    if (!loggedIn) {
      updateCount(null);
      return;
    }
    getCart()
      .then(updateCount)
      .catch(() => updateCount(null));
  }, [loggedIn, updateCount]);

  // Opens the category drawer, or shows/hides the inline sidebar on wide /products pages.
  function toggleMenu() {
    const { menuOpen, sideHidden, setMenuOpen, setSideHidden } =
      useUiStore.getState();
    const sideIsInline =
      pathname === "/products" &&
      window.matchMedia("(min-width: 1280px)").matches;
    if (sideIsInline) setSideHidden(!sideHidden);
    else setMenuOpen(!menuOpen);
  }

  // Opens the product list for the typed words.
  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const words = query.trim();
    router.push(
      words ? `/products?q=${encodeURIComponent(words)}` : "/products",
    );
  }

  return (
    <>
      <div className="bg-ink text-sm text-white">
        <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-3.5 gap-y-1 px-4 py-0.5">
          <button
            type="button"
            onClick={() => useUiStore.getState().toggleLanguage()}
            aria-label="Change language"
            className="min-h-8 rounded-full border border-[#35555A] px-3 font-semibold"
          >
            EN / हिं
          </button>
          <div className="flex items-center gap-2">
            <span className="max-sm:hidden">{text.theme}</span>
            {(Object.keys(ACCENTS) as Accent[]).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => useUiStore.getState().setAccent(color)}
                aria-label={`Theme colour ${color}`}
                aria-pressed={color === accent}
                className="my-1.5 h-6 w-6 rounded-full border-2 border-white outline outline-2 outline-offset-1"
                style={{
                  background: color,
                  outlineColor: color === accent ? "#FFC94D" : "transparent",
                }}
              />
            ))}
          </div>
          <span className="flex-1" />
          <Link
            href="/orders"
            className="flex min-h-9 items-center px-1 font-semibold"
          >
            {text.track}
          </Link>
          {isAdmin(role) && (
            <Link
              href="/admin"
              className="flex min-h-9 items-center px-1 font-semibold"
            >
              {text.admin}
            </Link>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-20 bg-white shadow-bar">
        <div className="mx-auto flex max-w-page flex-wrap items-center gap-2 px-4 py-2.5 min-[900px]:gap-2.5">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={text.menu}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ground"
          >
            <Menu className="h-[22px] w-[22px]" strokeWidth={2.4} aria-hidden />
          </button>
          <Link
            href="/"
            aria-label="ApnaKart home"
            className="flex min-h-11 items-center gap-2 text-xl font-extrabold text-accent min-[900px]:text-2xl"
          >
            <LogoIcon size={36} />
            ApnaKart
          </Link>
          <form
            role="search"
            onSubmit={search}
            className="order-last flex w-full rounded-full bg-ground p-1 min-[900px]:order-none min-[900px]:w-auto min-[900px]:flex-[1_1_320px]"
          >
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={text.search}
              placeholder={text.search}
              maxLength={80}
              className="min-h-10 min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid h-10 w-11 shrink-0 place-items-center rounded-full bg-accent text-white"
            >
              <Search className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            </button>
          </form>
          <nav
            aria-label="Your account"
            className="ml-auto flex items-center gap-1"
          >
            {loggedIn ? (
              <IconLink href="/account" label={text.account} icon={UserRound} />
            ) : (
              <IconLink href="/login" label={text.login} icon={UserRound} />
            )}
            <IconLink
              href="/orders"
              label={text.orders}
              icon={Package}
              className="max-[899px]:hidden"
            />
            <Link
              href="/cart"
              aria-label={`${text.cart}: ${count}`}
              className="flex min-h-11 items-center gap-2 rounded-full bg-accent px-3 font-extrabold text-white min-[900px]:px-4"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              <span className="min-w-6 rounded-full bg-sunny px-1.5 text-center text-sm text-ink">
                {count}
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <Suspense
        fallback={<CategoryBand categories={categories} activeSlug={null} />}
      >
        <ActiveCategoryBand categories={categories} />
      </Suspense>
      <Suspense fallback={null}>
        <SearchWords onChange={setQuery} />
      </Suspense>
    </>
  );
}

// Keeps the search box text in sync with ?q= on the product list.
function SearchWords({ onChange }: { onChange: (words: string) => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const words = pathname === "/products" ? (params.get("q") ?? "") : "";

  useEffect(() => onChange(words), [words, onChange]);
  return null;
}

// Header link with an icon; the label shows on wide screens only.
function IconLink({
  href,
  label,
  icon: Icon,
  className = "",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-semibold hover:bg-ground min-[900px]:px-2.5 ${className}`}
    >
      <Icon className="h-[22px] w-[22px]" aria-hidden />
      <span className="hidden min-[900px]:inline">{label}</span>
    </Link>
  );
}

// The category band with the current category highlighted.
function ActiveCategoryBand({ categories }: { categories: Category[] }) {
  const { categorySlug } = useActiveCategory(categories);
  return <CategoryBand categories={categories} activeSlug={categorySlug} />;
}

// Scrollable row of category pills under the header.
function CategoryBand({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug: string | null;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categories"
      className="border-t border-line bg-soft px-4 py-3.5"
    >
      <div className="mx-auto flex max-w-page gap-3 overflow-x-auto pb-0.5">
        {categories.map((category, index) => {
          const active = category.slug === activeSlug;
          return (
            <Link
              key={category.id}
              href={categoryHref(category.slug)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[52px] shrink-0 items-center gap-2.5 rounded-full border py-1 pl-1 pr-5 font-semibold ${active ? "border-accent bg-accent text-white" : "border-line bg-white"}`}
            >
              <span
                className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full"
                style={{ background: tintAt(index) }}
              >
                <SafeImage
                  src={category.image}
                  alt=""
                  sizes="42px"
                  className="object-contain p-1.5"
                />
              </span>
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
