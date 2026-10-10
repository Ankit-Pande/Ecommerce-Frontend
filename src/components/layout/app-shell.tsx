"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";
import { ChatWidget } from "@/features/assistant/chat-widget";

import type { Category } from "@/lib/types";

// Store layout with header, footer and the assistant; the assistant is hidden on cart and checkout.
export function AppShell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
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
      <main className="page min-h-[72vh]">{children}</main>
      <SiteFooter categories={categories} />
      {pathname !== "/checkout" && pathname !== "/cart" && <ChatWidget />}
      <Toaster />
    </>
  );
}
