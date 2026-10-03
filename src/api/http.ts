import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Don't let a cold or unreachable backend block server rendering.
const SERVER_TIMEOUT_MS = 2500;
const CLIENT_TIMEOUT_MS = 8000;

type ServerResult<T> = {
  data: T | null;
  status: number | null;
};

/** Server-side fetch that keeps the response status for pages that handle 404 separately. */
export async function serverGetResult<T>(
  path: string,
  revalidateSeconds: number,
): Promise<ServerResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
    if (!res.ok) return { data: null, status: res.status };
    const json = await res.json();
    return { data: (json.data ?? json) as T, status: res.status };
  } catch {
    return { data: null, status: null };
  }
}

/**
 * Server-side fetch for public data. Returns null instead of throwing, so the
 * page shell (navbar, footer, layout) always renders even when the API is down.
 */
export async function serverGet<T>(
  path: string,
  revalidateSeconds: number,
): Promise<T | null> {
  const result = await serverGetResult<T>(path, revalidateSeconds);
  return result.data;
}

/** Public endpoint called from the browser. No token, throws on failure. */
export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return (await res.json()) as T;
}

// Only one refresh call at a time — parallel 401s share the same promise.
let refreshInFlight: Promise<boolean> | null = null;

// The refresh token lives only in the backend's httpOnly cookie, so no body is sent.
async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const json = await res.json();
    useAuthStore.getState().setAccessToken(json.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Restores an in-memory access token from the backend's httpOnly cookie. */
export function restoreSession(): Promise<boolean> {
  return refreshOnce();
}

/** Authenticated request. On a 401 it refreshes the token and retries once. */
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  // Never set Content-Type on FormData — the browser adds the multipart boundary.
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  if (res.status === 401 && !isRetry) {
    if (await refreshOnce()) return request<T>(path, options, true);
    useAuthStore.getState().logout();
    throw new Error("Your session has expired. Please log in again.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? "Something went wrong");
  return json as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patchForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "PATCH", body: form }),
};

/** Turns any thrown value into a message safe to show the user. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Revokes the server session, then clears local auth and reloads the home page.
 * A full reload also drops every in-memory user value (cart badge, cached pages).
 */
export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch {
    // A network failure must not trap the user; the local logout still happens.
  }
  useAuthStore.getState().logout();
  window.location.assign("/");
}
