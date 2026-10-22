import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt: private pages are not crawled.
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/checkout",
        "/order-placed",
        "/orders",
        "/account",
        "/admin",
        "/login",
      ],
    },
  };
}
