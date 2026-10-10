import { GridSkeleton } from "@/components/ui/skeletons";

// Loading screen for the home page.
export default function HomeLoading() {
  return (
    <div>
      <div className="mt-4 h-44 animate-pulse rounded-xl bg-gray-200 sm:h-56 md:h-72" />
      <div className="my-8 h-6 w-44 animate-pulse rounded bg-gray-200" />
      <GridSkeleton />
    </div>
  );
}
