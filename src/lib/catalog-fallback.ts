import type { Category } from "@/lib/types";

const FALLBACK_ID = "fallback:";

function item(name: string) {
  return {
    id: `${FALLBACK_ID}${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
  };
}

export const fallbackCategories: Category[] = [
  {
    ...item("Electronics"),
    image: null,
    children: [item("Mobiles"), item("Laptops"), item("Audio")],
  },
  {
    ...item("Fashion"),
    image: null,
    children: [
      item("Men fashion"),
      item("Women fashion"),
      item("Kids fashion"),
    ],
  },
  {
    ...item("Home"),
    image: null,
    children: [item("Home decor"), item("Kitchen"), item("Furniture")],
  },
  {
    ...item("Beauty"),
    image: null,
    children: [item("Skin care"), item("Hair care"), item("Personal care")],
  },
  {
    ...item("Grocery"),
    image: null,
    children: [item("Snacks"), item("Beverages"), item("Daily needs")],
  },
  {
    ...item("Sports"),
    image: null,
    children: [item("Fitness"), item("Outdoor"), item("Sports shoes")],
  },
  {
    ...item("Books & Stationery"),
    image: null,
    children: [item("Books"), item("Office supplies"), item("School supplies")],
  },
  {
    ...item("Toys & Baby"),
    image: null,
    children: [item("Toys"), item("Baby care"), item("Kids learning")],
  },
];

type CatalogLevel = "category" | "subcategory";

// The backend filters by slug: ?category= for a parent, ?subcategory= for a child.
// Fallback entries are not real categories, so they become a plain search.
export function catalogQuery(
  entry: { id: string; name: string; slug: string },
  level: CatalogLevel = "category",
) {
  return entry.id.startsWith(FALLBACK_ID)
    ? `q=${encodeURIComponent(entry.name)}`
    : `${level}=${encodeURIComponent(entry.slug)}`;
}

export function catalogHref(
  entry: { id: string; name: string; slug: string },
  level: CatalogLevel = "category",
) {
  return `/products?${catalogQuery(entry, level)}`;
}
