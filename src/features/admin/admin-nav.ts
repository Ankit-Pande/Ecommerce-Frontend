import {
  Boxes,
  Image,
  LayoutDashboard,
  PackageCheck,
  Shapes,
  Tags,
  UsersRound,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/users", label: "Customers", icon: UsersRound },
] as const;

export function isActiveAdminLink(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
  );
}
