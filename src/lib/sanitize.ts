// Allows only internal paths and http(s) links.
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
