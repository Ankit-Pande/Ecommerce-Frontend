"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { hideProduct, listProducts, updateProduct } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { inr } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminProduct } from "@/lib/types";

// All products with search, stock, reserved quantity and hide/show.
export function AdminProducts() {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const words = useDebouncedValue(search.trim());

  // Loads one page of products for the typed words.
  const loadProducts = useCallback(
    (cursor?: string) => listProducts(cursor, words),
    [words],
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

  // Hides or shows a product in the store.
  async function toggleVisible(product: AdminProduct) {
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
      toast.success(
        product.isActive ? "Product hidden from the store" : "Product is live",
      );
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this product"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <AdminTitle title="Products">
        <Link href="/admin/products/bulk" className="btn-outline">
          Bulk upload
        </Link>
        <Link href="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </AdminTitle>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        maxLength={100}
        placeholder="Search product name"
        aria-label="Search products"
        className="field max-w-md"
      />

      {loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No products found
        </p>
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
                  {(product.isTrending || product.isFeatured) && (
                    <span className="block text-sm font-normal text-muted">
                      {[
                        product.isTrending && "Trending",
                        product.isFeatured && "Featured",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span>{inr(product.pricePaise)}</span>
                <span>
                  {product.stock}
                  {product.reservedQuantity > 0 && (
                    <span className="block text-sm text-muted">
                      {product.reservedQuantity} waiting for payment
                    </span>
                  )}
                </span>
                <span>
                  <StatusPill
                    tone={product.isActive ? "good" : "bad"}
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
                    onClick={() => toggleVisible(product)}
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
    </>
  );
}
