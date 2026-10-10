import { Suspense } from "react";
import { getHomeOnServer } from "@/api/catalog";
import { LoginForm } from "@/features/login/login-form";

// Login and sign up page; category pictures fill the left panel.
export default async function LoginRoute() {
  const home = await getHomeOnServer();
  return (
    <Suspense fallback={<div className="min-h-screen bg-sunny" />}>
      <LoginForm categories={home?.categories ?? []} />
    </Suspense>
  );
}
