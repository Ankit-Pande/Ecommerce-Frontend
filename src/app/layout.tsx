import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getHomeOnServer } from "@/api/catalog";
import { AppSetup } from "@/components/layout/app-setup";
import { AppShell } from "@/components/layout/app-shell";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  weight: ["400", "600", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ApnaKart — Online shopping", template: "%s | ApnaKart" },
  description:
    "Shop mobiles, fashion, electronics and more with Cash on Delivery and UPI.",
  openGraph: { siteName: "ApnaKart", type: "website" },
};

export const revalidate = 60;

// Root layout: font, app setup and the page frame with categories from the server.
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const home = await getHomeOnServer();

  return (
    <html lang="en" className={font.variable}>
      <body>
        <AppSetup />
        <AppShell categories={home?.categories ?? []}>{children}</AppShell>
      </body>
    </html>
  );
}
