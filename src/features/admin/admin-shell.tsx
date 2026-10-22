"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/banners", label: "Carousel slides" },
  { href: "/admin/sale", label: "Sale" },
  { href: "/admin/users", label: "Users" },
];

// Admin frame: admin-only guard, side menu and the page.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready } = useAuthGuard(true);
  const pathname = usePathname();

  if (!ready) {
    return (
      <div className="mx-auto max-w-page p-6">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col xl:flex-row">
      <nav
        aria-label="Admin"
        className="flex shrink-0 flex-col gap-1.5 bg-white px-3.5 py-4 shadow-bar xl:w-[240px] xl:py-5"
      >
        <Link
          href="/admin"
          className="px-2.5 pb-2 text-2xl font-extrabold text-accent"
        >
          ApnaKart Admin
        </Link>
        <div className="flex gap-1.5 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
          {LINKS.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 shrink-0 items-center rounded-xl px-3.5 font-semibold ${active ? "bg-accent text-white" : "hover:bg-ground"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/" className="btn-outline shrink-0 xl:mt-3">
            View store
          </Link>
        </div>
      </nav>
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

// Admin page title with optional buttons on the right.
export function AdminTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="page-title">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
