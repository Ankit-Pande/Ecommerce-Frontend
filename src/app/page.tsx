import { getHomeOnServer } from "@/api/catalog";
import { fallbackCategories } from "@/lib/catalog-fallback";
import { HomeContent } from "@/features/catalog/home-content";
import { HomeRetry } from "@/features/catalog/home-retry";

// Static page (ISR): rebuilt in the background every minute, not on every visit.
export default async function HomePage() {
  const home = await getHomeOnServer();
  if (!home) return <HomeRetry categories={fallbackCategories} />;

  return <HomeContent home={home} />;
}
