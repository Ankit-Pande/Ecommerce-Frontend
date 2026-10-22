"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginHref } from "@/lib/links";
import { isAdmin, useAuthStore } from "@/store/auth-store";

// Sends guests to login (and non-admins home on admin pages); ready is true when the page may show.
export function useAuthGuard(adminOnly = false) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(
        loginHref(window.location.pathname + window.location.search),
      );
    } else if (adminOnly && !isAdmin(role)) {
      router.replace("/");
    }
  }, [hydrated, accessToken, role, adminOnly, router]);

  return { ready: hydrated && !!accessToken && (!adminOnly || isAdmin(role)) };
}
