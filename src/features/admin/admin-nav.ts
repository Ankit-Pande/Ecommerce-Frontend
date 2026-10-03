import {
  Boxes,
  BadgePercent,
  Image,
  LayoutDashboard,
  PackageCheck,
  Shapes,
  Tags,
  UsersRound,
} from "lucide-react";

export const adminNavGroups = [
  {
    title: "Store",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: PackageCheck },
      { href: "/admin/products", label: "Products", icon: Boxes },
      { href: "/admin/sale", label: "Sale & offers", icon: BadgePercent },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Shapes },
      { href: "/admin/brands", label: "Brands", icon: Tags },
      { href: "/admin/banners", label: "Banners", icon: Image },
    ],
  },
  {
    title: "People",
    items: [{ href: "/admin/users", label: "Customers", icon: UsersRound }],
  },
];

export const adminNav = adminNavGroups.flatMap((group) => group.items);

// True when the link matches the current admin page.
export function isActiveAdminLink(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
  );
}
