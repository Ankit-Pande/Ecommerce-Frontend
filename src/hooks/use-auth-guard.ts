"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdmin, useAuthStore } from "@/store/auth-store";

// Protected pages wait for the saved session before loading their data.
export function useAuthGuard() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !accessToken) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hydrated, accessToken, router]);

  return { ready: hydrated && !!accessToken };
}

export function useAdminGuard() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (!isAdmin(role)) router.replace("/");
  }, [hydrated, accessToken, role, router]);

  return { ready: hydrated && !!accessToken && isAdmin(role) };
}
