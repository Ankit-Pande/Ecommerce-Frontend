import { getHomeOnServer } from "@/api/catalog";
import { HomeContent } from "@/features/catalog/home-content";
import { HomeRetry } from "@/features/catalog/home-retry";

// Home page, rebuilt every minute from the backend.
export default async function HomePage() {
  const home = await getHomeOnServer();
  if (!home) return <HomeRetry />;

  return <HomeContent home={home} />;
}
