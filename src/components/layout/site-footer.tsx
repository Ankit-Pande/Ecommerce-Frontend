import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { catalogHref } from "@/lib/format";
import type { Category } from "@/lib/types";

const SUPPORT_EMAIL = "support@apnakart.in";
const SUPPORT_PHONE = "6392061026";

const SHOP_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/products?section=trending", label: "Trending" },
  { href: "/products?discount=true", label: "Offers" },
  { href: "/products?sort=latest", label: "New arrivals" },
];

const ACCOUNT_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/orders", label: "My orders" },
  { href: "/account#addresses", label: "Saved addresses" },
  { href: "/cart", label: "Shopping cart" },
];

// Footer with category, shop and account links.
export function SiteFooter({ categories }: { categories: Category[] }) {
  const categoryLinks = categories.map((category) => ({
    href: catalogHref(category),
    label: category.name,
  }));

  return (
    <footer className="mt-12 bg-chrome pb-20 text-white md:pb-0">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-9 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <Link href="/">
            <Wordmark onDark className="text-2xl" />
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-5 text-white/55">
            Trusted products, fair prices and reliable delivery across India.
          </p>
          <div className="mt-4 flex flex-col gap-2.5 text-xs font-extrabold text-sky-300">
            <a
              href={`tel:+91${SUPPORT_PHONE}`}
              className="inline-flex items-center gap-2"
            >
              <Phone className="h-4 w-4" /> +91 {SUPPORT_PHONE}
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <FooterLinks title="Categories" links={categoryLinks} />
        <FooterLinks title="Shop" links={SHOP_LINKS} />
        <FooterLinks title="Account" links={ACCOUNT_LINKS} />
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] font-medium text-white/35">
        © {new Date().getFullYear()} ApnaKart. All rights reserved.
      </div>
    </footer>
  );
}

// One titled column of footer links.
function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-xs font-semibold text-white/60 transition hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
