"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useAdminGuard } from "@/hooks/use-auth-guard";
import { adminNav, isActiveAdminLink } from "@/features/admin/admin-nav";

// Admin layout: white sidebar with tabs and the page next to it.
export function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { ready } = useAdminGuard();
  const pathname = usePathname();
  const current = adminNav.find((item) =>
    isActiveAdminLink(pathname, item.href),
  );

  if (!ready) {
    return (
      <div className="page">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-wrap">
      <nav
        aria-label="Admin"
        className="flex flex-[1_1_220px] flex-col gap-1.5 bg-white px-3.5 py-5 shadow-bar"
      >
        <Link
          href="/admin"
          className="px-2.5 pb-2.5 text-2xl font-extrabold text-accent"
        >
          ApnaKart Admin
        </Link>
        {adminNav.map((item) => {
          const active = isActiveAdminLink(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-xl px-3.5 font-semibold ${active ? "bg-accent text-white" : "hover:bg-ground"}`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link href="/" className="btn-outline mt-3">
          View store
        </Link>
      </nav>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 p-6">
        <h1 className="text-[32px] font-extrabold">
          {current?.label ?? "Admin"}
        </h1>
        {children}
      </main>
    </div>
  );
}
