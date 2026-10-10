"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { hideProduct, listProducts, updateProduct } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { inr } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";
import { toast } from "@/store/toast-store";

// Admin product list.
export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const term = useDebouncedValue(search);

  const loadProducts = useCallback(
    (cursor?: string) => listProducts(cursor, term.trim()),
    [term],
  );

  const {
    items,
    setItems,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<AdminProduct>(loadProducts);

  // Hides or shows a product.
  async function toggleActive(product: AdminProduct) {
    setBusyId(product.id);

    try {
      if (product.isActive) {
        await hideProduct(product.id);
      } else {
        const form = new FormData();
        form.append("isActive", "true");
        await updateProduct(product.id, form);
      }

      setItems((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, isActive: !product.isActive }
            : item,
        ),
      );
      toast.success(product.isActive ? "Product hidden" : "Product published");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this product"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product name"
          aria-label="Search products"
          className="field max-w-sm flex-[1_1_220px]"
        />
        <div className="ml-auto flex gap-2">
          <Link href="/admin/products/bulk" className="btn-outline">
            Bulk upload
          </Link>
          <Link href="/admin/products/new" className="btn-primary">
            Add product
          </Link>
        </div>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="card p-8 text-center font-semibold">No products found</p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Product</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {items.map((product) => (
              <div key={product.id} className="data-row">
                <span className="font-semibold">
                  {product.name}
                  {product.isTrending && (
                    <span className="block text-sm font-normal text-muted">
                      Trending
                    </span>
                  )}
                </span>
                <span>{inr(product.pricePaise)}</span>
                <span>
                  {product.stock}
                  {product.reservedQuantity > 0 && (
                    <span className="block text-sm text-muted">
                      {product.reservedQuantity} in open orders
                    </span>
                  )}
                </span>
                <span>
                  <StatusPill
                    tone={product.isActive ? "green" : "red"}
                    label={product.isActive ? "Visible" : "Hidden"}
                  />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="btn-table"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleActive(product)}
                    disabled={busyId === product.id}
                    className="btn-table"
                  >
                    {product.isActive ? "Hide" : "Unhide"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
    </div>
  );
}
