"use client";

import { listBrands, listCategories } from "@/api/admin";
import { useAdminData } from "@/features/admin/use-admin-data";

// Categories and brands for the product forms.
export function useProductOptions() {
  const categories = useAdminData(listCategories);
  const brands = useAdminData(listBrands);

  return {
    categories: categories.data ?? [],
    brands: brands.data ?? [],
    loading: categories.loading || brands.loading,
    failed: categories.failed,
    // Loads categories and brands again.
    reload: () => {
      void categories.load();
      void brands.load();
    },
  };
}
