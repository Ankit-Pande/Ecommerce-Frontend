import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Private pages are kept out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/checkout",
        "/orders",
        "/account",
        "/admin",
        "/login",
      ],
    },
  };
}
