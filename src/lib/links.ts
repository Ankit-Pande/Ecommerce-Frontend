const SAFE_PATH = /^\/(?![/\\])[^\s\\]*$/;

// Product list link for a category.
export function categoryHref(slug: string) {
  return `/products?category=${encodeURIComponent(slug)}`;
}

// Product list link for a subcategory.
export function subcategoryHref(slug: string) {
  return `/products?subcategory=${encodeURIComponent(slug)}`;
}

// Login link that comes back to `next` after login.
export function loginHref(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

// Checkout link that buys only this product (with size, colour and quantity).
export function buyNowHref(
  slug: string,
  choice: { size?: string; color?: string; quantity?: number } = {},
) {
  const params = new URLSearchParams({ buy: slug });
  if (choice.size) params.set("size", choice.size);
  if (choice.color) params.set("color", choice.color);
  if (choice.quantity && choice.quantity > 1) {
    params.set("qty", String(choice.quantity));
  }
  return `/checkout?${params}`;
}

// Allows only paths on this site (no "//other-site" or "https://") as a redirect.
export function safeNextPath(value: string | null) {
  return value && SAFE_PATH.test(value) ? value : null;
}

// A banner link the admin typed: a path on this site or an http(s) URL, else null.
export function safeLink(value: string | null) {
  const link = value?.trim();
  if (!link) return null;
  if (link.startsWith("/")) return safeNextPath(link);
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
