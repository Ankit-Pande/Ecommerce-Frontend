// Values that arrive from admin input or the API and end up in href or style.

const PLAIN_COLOR = /^#[0-9a-f]{3,8}$|^[a-z]+$/i;

/** Keeps only internal paths and http(s) links, so a stored "javascript:" value can never run. */
export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const { protocol, href } = new URL(trimmed);
    return protocol === "http:" || protocol === "https:" ? href : null;
  } catch {
    return null;
  }
}

/** Keeps only colour names and hex codes, so an inline style cannot load a remote value. */
export function safeColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && PLAIN_COLOR.test(trimmed) ? trimmed : null;
}
