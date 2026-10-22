import { GridSkeleton } from "@/components/ui/skeletons";

// Shown while the product list loads.
export default function ProductsLoading() {
  return <GridSkeleton count={12} />;
}
