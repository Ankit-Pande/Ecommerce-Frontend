"use client";

import { usePathname } from "next/navigation";
import { CategorySidebar } from "@/components/layout/category-sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";
import { AssistantWidget } from "@/features/assistant/assistant-widget";
import type { Category } from "@/lib/types";

// Page frame: header, category sidebar, footer and assistant (admin and login pages get only the page).
export function AppShell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname === "/login") {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SiteHeader categories={categories} />
      <div className="mx-auto flex w-full max-w-page flex-wrap items-start gap-6 px-4 py-5">
        <CategorySidebar categories={categories} />
        <main className="flex min-h-[60vh] min-w-0 flex-[999_1_560px] flex-col gap-7">
          {children}
        </main>
      </div>
      <SiteFooter categories={categories} />
      <AssistantWidget />
      <Toaster />
    </>
  );
}
