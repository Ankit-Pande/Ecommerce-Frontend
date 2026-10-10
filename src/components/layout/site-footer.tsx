"use client";

import Link from "next/link";
import { catalogHref } from "@/lib/format";
import { useUiStore } from "@/store/ui-store";
import { SearchBox } from "./search-box";
import type { Category } from "@/lib/types";

const SUPPORT_EMAIL = "support@apnakart.in";
const SUPPORT_PHONE = "6392061026";

const ACCOUNT_LINKS = [
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "Profile and addresses" },
  { href: "/cart", label: "Cart" },
  { href: "/login", label: "Login" },
];

// Dark footer: logo, search, support contact and Shop / Account / Help links.
export function SiteFooter({ categories }: { categories: Category[] }) {
  const setChatOpen = useUiStore((state) => state.setChatOpen);
  const linkClass = "flex min-h-10 items-center text-left";

  return (
    <footer className="mt-6 rounded-t-[32px] bg-ink px-6 py-9 text-white">
      <div className="mx-auto flex max-w-page flex-wrap gap-7">
        <div className="flex flex-[2_1_280px] flex-col gap-3">
          <Link href="/" className="text-[32px] font-extrabold text-mint">
            ApnaKart
          </Link>
          <SearchBox
            label="Search"
            placeholder="Search products"
            className="max-w-[460px] bg-white"
          />
          <p>
            <a href={`tel:+91${SUPPORT_PHONE}`} className="text-white">
              +91 {SUPPORT_PHONE}
            </a>
            {" · "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-white">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <FooterColumn title="Shop" color="text-mint">
          {categories.slice(0, 5).map((category) => (
            <Link key={category.id} href={catalogHref(category)} className={linkClass}>
              {category.name}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Account" color="text-sunny">
          {ACCOUNT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Help" color="text-[#FFB3C7]">
          <Link href="/orders" className={linkClass}>
            Track order
          </Link>
          <button type="button" onClick={() => setChatOpen(true)} className={linkClass}>
            Ask the assistant
          </button>
          <Link href="/admin" className={linkClass}>
            Admin panel
          </Link>
        </FooterColumn>
      </div>

      <div className="mx-auto mt-5 flex max-w-page flex-wrap justify-between gap-2 border-t border-[#35555A] pt-3.5">
        <span>UPI · Google Pay · PhonePe · Paytm · Cards · Net banking · Cash on Delivery</span>
        <span>© 2026 ApnaKart</span>
      </div>
    </footer>
  );
}

// One titled column of footer links.
function FooterColumn({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-[1_1_150px] flex-col">
      <p className={`text-lg font-extrabold ${color}`}>{title}</p>
      {children}
    </div>
  );
}
