import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SERVER_TIMEOUT_MS = 5000;
const CLIENT_TIMEOUT_MS = 15000;
// Checkout, payment and the assistant do several steps on the server.
const WRITE_TIMEOUT_MS = 30000;
const SLOW_MESSAGE = "The server is taking too long. Please try again.";

// fetch with a time limit; a timeout becomes a clear message.
async function fetchWithTimeout(url: string, options: RequestInit, ms: number) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(ms) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error(SLOW_MESSAGE);
    }
    throw new Error("Could not reach the server. Check your connection.");
  }
}

type ServerResult<T> = {
  data: T | null;
  status: number | null;
};

// Server fetch that keeps the status code.
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

// Server fetch that returns null on any failure.
export async function serverGet<T>(
  path: string,
  revalidateSeconds: number,
): Promise<T | null> {
  const result = await serverGetResult<T>(path, revalidateSeconds);
  return result.data;
}

// Browser fetch for public APIs.
export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(
    `${API_URL}${path}`,
    {},
    CLIENT_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return (await res.json()) as T;
}

let refreshInFlight: Promise<boolean> | null = null;

// Gets a new access token using the refresh cookie.
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

// Runs only one refresh at a time.
function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// Restores the login after a page reload.
export function restoreSession(): Promise<boolean> {
  return refreshOnce();
}

// Logged-in request; on 401 it refreshes once and retries.
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const isFormData = options.body instanceof FormData;

  const res = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    },
    options.method ? WRITE_TIMEOUT_MS : CLIENT_TIMEOUT_MS,
  );

  if (res.status === 401 && !isRetry) {
    if (await refreshOnce()) return request<T>(path, options, true);
    useAuthStore.getState().logout();
    throw new Error("Your session has expired. Please log in again.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? "Something went wrong");
  return json as T;
}

// Short helpers for logged-in requests.
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

// Error text that is safe to show the user.
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// Logs out on the server, clears local login and reloads the home page.
export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch {}
  useAuthStore.getState().logout();
  window.location.assign("/");
}
