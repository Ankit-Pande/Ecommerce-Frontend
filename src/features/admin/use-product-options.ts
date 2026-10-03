"use client";

import { listBrands, listCategories } from "@/api/admin";
import { useAdminData } from "@/features/admin/use-admin-data";

// Categories and brands for the product form.
export function useProductOptions() {
  const categoryState = useAdminData(listCategories);
  const brandState = useAdminData(listBrands);

  return {
    categories: categoryState.data ?? [],
    brands: brandState.data ?? [],
    loading: categoryState.loading,
    brandsLoading: brandState.loading,
    failed: categoryState.failed,
    brandsFailed: brandState.failed,
    reloadCategories: categoryState.load,
    reloadBrands: brandState.load,
  };
}
