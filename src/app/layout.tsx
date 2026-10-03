import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";
import { getHomeOnServer } from "@/api/catalog";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const displayFont = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ApnaKart — Shopping made simple",
    template: "%s | ApnaKart",
  },
  description:
    "Discover trusted products, fair prices and reliable delivery across India.",
  keywords: [
    "online shopping",
    "India",
    "ecommerce",
    "mobiles",
    "laptops",
    "fashion",
  ],
  openGraph: {
    siteName: "ApnaKart",
    type: "website",
    title: "ApnaKart — Shopping made simple",
    description:
      "Trusted products, fair prices and reliable delivery across India.",
  },
};

const MAX_MENU_CATEGORIES = 8;

export const revalidate = 60;

// Root layout; loads categories for the menu.
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const home = await getHomeOnServer();
  const categories = home?.categories.slice(0, MAX_MENU_CATEGORIES) ?? [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased`}
      >
        <Providers>
          <AppShell categories={categories}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
