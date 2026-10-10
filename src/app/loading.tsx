import { GridSkeleton } from "@/components/ui/skeletons";

// Loading screen for the home page.
export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-7">
      <div className="h-[300px] animate-pulse rounded-[28px] bg-white" />
      <GridSkeleton />
    </div>
  );
}
