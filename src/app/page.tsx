import { getHomeOnServer } from "@/api/catalog";
import { HomeContent } from "@/features/home/home-content";
import { HomeRetry } from "@/features/home/home-retry";

// Home page, rendered on the server (refreshed every 60 seconds).
export default async function HomePage() {
  const home = await getHomeOnServer();
  if (!home) return <HomeRetry />;
  return <HomeContent home={home} />;
}
