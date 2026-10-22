import type { Metadata } from "next";
import { AccountPage } from "@/features/account/account-page";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

// The /account page.
export default function AccountRoute() {
  return <AccountPage />;
}
