"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import {
  ProductForm,
  type ProductFormValues,
} from "@/features/admin/product-form";
import { useAdminData } from "@/features/admin/use-admin-data";
import { getProduct } from "@/api/admin";
import type { AdminProductDetail } from "@/lib/types";

function formValues(product: AdminProductDetail): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: String(product.pricePaise / 100),
    discountPercent: String(product.discountPercent),
    offerEndsAt: product.offerEndsAt ? toLocalInput(product.offerEndsAt) : "",
    stock: String(product.stock),
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    color: product.color ?? "",
    gender: product.gender ?? "",
    ageGroup: product.ageGroup ?? "",
    isTrending: product.isTrending,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
}

// ISO time -> "YYYY-MM-DDTHH:mm" in the admin's own timezone, for datetime-local.
function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function EditProductPage({ productId }: { productId: string }) {
  const fetchProduct = useCallback(() => getProduct(productId), [productId]);

  const { data: product, loading, failed, load } = useAdminData(fetchProduct);

  if (loading) return <ListSkeleton count={2} />;
  if (failed || !product) return <OfflineNotice onRetry={load} />;

  return (
    <div>
      <Link href="/admin/products" className="btn-ghost -ml-3 mb-3">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <h2 className="mb-5 font-display text-2xl font-bold">Edit product</h2>
      <ProductForm
        productId={productId}
        initial={formValues(product)}
        existingImageCount={product.images.length}
      />
    </div>
  );
}
