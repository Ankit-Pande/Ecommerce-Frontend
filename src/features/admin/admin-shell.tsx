"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, UserRound } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Wordmark } from "@/components/ui/wordmark";
import { useAdminGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import {
  adminNav,
  adminNavGroups,
  isActiveAdminLink,
} from "@/features/admin/admin-nav";

// Admin layout: sidebar on desktop, tabs on phones.
export function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { ready } = useAdminGuard();
  const pathname = usePathname();
  const phone = useAuthStore((state) => state.phone);
  const role = useAuthStore((state) => state.role);
  const current = adminNav.find((item) =>
    isActiveAdminLink(pathname, item.href),
  );

  if (!ready) {
    return (
      <div className="py-8">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="gap-5 py-4 sm:py-6 lg:grid lg:min-h-screen lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="card hidden flex-col p-4 lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)]">
        <Link href="/admin" className="px-2">
          <Wordmark className="text-xl" />
        </Link>
        <p className="mt-1 px-2 text-xs text-gray-500">Admin panel</p>

        <nav
          className="mt-6 flex-1 space-y-5 overflow-y-auto"
          aria-label="Admin navigation"
        >
          {adminNavGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const active = isActiveAdminLink(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                        active
                          ? "bg-accent text-white shadow-button"
                          : "text-gray-600 hover:bg-ground hover:text-ink"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-white" : ""}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-3 border-t border-line px-2 pt-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">+91 {phone}</p>
            <p className="text-xs text-gray-500">
              {role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
            </p>
          </div>
          <Link
            href="/"
            aria-label="View store"
            title="View store"
            className="icon-button"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <nav
          className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin lg:hidden"
          aria-label="Admin navigation"
        >
          {adminNav.map((item) => {
            const active = isActiveAdminLink(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold ${
                  active ? "bg-accent text-white" : "bg-white text-gray-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="card min-h-[70vh] p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">
                Admin / {current?.label ?? "Manage store"}
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-bold">
                {current?.label ?? "Manage store"}
              </h1>
            </div>
            <Link href="/" className="btn-ghost lg:hidden">
              Store <ExternalLink className="h-4 w-4" />
            </Link>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
