"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Wordmark } from "@/components/ui/wordmark";
import { useAdminGuard } from "@/hooks/use-auth-guard";
import { adminNav, isActiveAdminLink } from "@/features/admin/admin-nav";

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
      <div className="py-8">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-12 pt-5 sm:pt-7">
      <div className="overflow-hidden rounded-3xl border border-sand bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.03] lg:grid lg:min-h-[720px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden bg-chrome p-5 text-white lg:flex lg:flex-col">
          <Link href="/admin">
            <Wordmark onDark className="text-2xl" />
          </Link>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50">
            Admin panel
          </p>

          <nav className="mt-8 space-y-1" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const active = isActiveAdminLink(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition ${
                    active
                      ? "bg-white text-chrome shadow-lg"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            className="mt-auto flex items-center gap-1.5 text-xs font-extrabold text-sky-300"
          >
            View store <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between gap-3 border-b border-sand px-4 py-4 dark:border-white/10 sm:px-6 lg:px-8 lg:py-5">
            <h1 className="font-display text-2xl font-bold">
              {current?.label ?? "Manage store"}
            </h1>
            <Link href="/" className="btn-ghost lg:hidden">
              Store <ExternalLink className="h-4 w-4" />
            </Link>
          </header>

          <nav
            className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-sand px-3 py-2 dark:border-white/10 lg:hidden"
            aria-label="Admin navigation"
          >
            {adminNav.map((item) => {
              const active = isActiveAdminLink(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold ${
                    active ? "bg-accent text-white" : "text-gray-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
