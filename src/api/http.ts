import type { Paginated } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SERVER_TIMEOUT_MS = 5000;
const CLIENT_TIMEOUT_MS = 15000;
const WRITE_TIMEOUT_MS = 30000;

// fetch with a time limit; network failures become messages a shopper understands.
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
) {
  try {
    return await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("The server is taking too long. Please try again.");
    }
    throw new Error("Could not reach the server. Check your connection.");
  }
}

// Server-side GET, cached for revalidateSeconds; sends INTERNAL_API_KEY so all visitors don't share one IP limit.
async function serverFetch(path: string, revalidateSeconds: number) {
  try {
    const key = process.env.INTERNAL_API_KEY;
    const response = await fetch(`${API_URL}${path}`, {
      headers: key ? { "x-internal-key": key } : {},
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
    return {
      json: response.ok ? await response.json() : null,
      status: response.status,
    };
  } catch {
    return { json: null, status: null };
  }
}

// Server-side GET of { data }: the data (or null) and the HTTP status (null when the API is down).
export async function serverGetResult<T>(
  path: string,
  revalidateSeconds: number,
): Promise<{ data: T | null; status: number | null }> {
  const { json, status } = await serverFetch(path, revalidateSeconds);
  return { data: (json?.data as T) ?? null, status };
}

// Server-side GET of one list page, or null when it failed.
export async function serverGetPage<T>(
  path: string,
  revalidateSeconds: number,
): Promise<Paginated<T> | null> {
  const { json } = await serverFetch(path, revalidateSeconds);
  return json?.items
    ? { items: json.items, nextCursor: json.nextCursor }
    : null;
}

// Browser GET that needs no login (public pages); throws the API's message on errors.
export async function publicGet<T>(path: string): Promise<T> {
  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {},
    CLIENT_TIMEOUT_MS,
  );
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message ?? "Something went wrong");
  return json as T;
}

let refreshInFlight: Promise<boolean> | null = null;

// Gets a new access token with the refresh cookie; true when it worked.
async function refreshTokens() {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return false;
    const json = await response.json();
    useAuthStore.getState().setAccessToken(json.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Refreshes the access token once, even when many requests ask at the same time.
export function restoreSession() {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// Browser request with the access token; on 401 it refreshes the token once and tries again.
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const isForm = options.body instanceof FormData;

  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        ...(!isForm && { "Content-Type": "application/json" }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    },
    options.method ? WRITE_TIMEOUT_MS : CLIENT_TIMEOUT_MS,
  );

  if (response.status === 401 && !isRetry) {
    if (await restoreSession()) return request<T>(path, options, true);
    useAuthStore.getState().logout();
    throw new Error("Your session has expired. Please log in again.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message ?? "Something went wrong");
  return json as T;
}

// One short function per HTTP method; all of them go through request().
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

// The message of a caught error, or the fallback text.
export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// Ends the session on the server, clears the login in the browser and opens the given page.
export async function logoutSession(goTo = "/") {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  }).catch(() => undefined);
  useAuthStore.getState().logout();
  window.location.assign(goTo);
}
