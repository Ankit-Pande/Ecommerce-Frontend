"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";

import type { Category } from "@/lib/types";

// Store layout with header and footer; admin pages get their own layout.
export function AppShell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) {
    return (
      <>
        <div className="mx-auto min-h-screen max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SiteHeader categories={categories} />
      <main className="mx-auto min-h-[72vh] max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter categories={categories} />
      <BottomNav />
      <Toaster />
    </>
  );
}
