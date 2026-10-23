"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getProduct } from "@/api/admin";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { AdminTitle } from "@/features/admin/admin-shell";
import { ProductForm } from "@/features/admin/product-form";
import { useAdminData } from "@/features/admin/use-admin-data";

// Loads one product and shows the product form for it.
export function EditProductPage({ productId }: { productId: string }) {
  // Loads the product being edited.
  const fetchProduct = useCallback(() => getProduct(productId), [productId]);
  const { data: product, loading, failed, load } = useAdminData(fetchProduct);

  let formSection;
  if (loading) {
    formSection = <ListSkeleton count={2} />;
  } else if (failed || !product) {
    formSection = <OfflineNotice onRetry={load} />;
  } else {
    formSection = <ProductForm key={product.id} product={product} />;
  }

  return (
    <>
      <AdminTitle title="Edit product">
        <Link href="/admin/products" className="btn-line">
          ‹ Products
        </Link>
      </AdminTitle>
      {formSection}
    </>
  );
}
