import { Suspense } from "react";
import type { Metadata } from "next";
import { getHomeOnServer } from "@/api/catalog";
import { LoginForm } from "@/features/login/login-form";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

// The /login page.
export default async function LoginRoute() {
  const home = await getHomeOnServer();
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <LoginForm categories={home?.categories ?? []} />
    </Suspense>
  );
}
