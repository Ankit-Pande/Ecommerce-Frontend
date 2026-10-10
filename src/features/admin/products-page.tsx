"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Star,
  Upload,
} from "lucide-react";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Spinner } from "@/components/ui/spinner";
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
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <span className="sr-only">Search products</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product name"
            className="field pl-10"
          />
        </label>

        <div className="ml-auto flex gap-2">
          <Link href="/admin/products/bulk" className="btn-outline px-4">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk upload</span>
          </Link>
          <Link href="/admin/products/new" className="btn-primary px-4">
            <Plus className="h-4 w-4" /> New product
          </Link>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <ListSkeleton />
        ) : failed ? (
          <OfflineNotice onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No products found</p>
            <p className="mt-1 text-xs text-gray-500">
              Try another search or add a product.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((product) => {
              const activeStyle = product.isActive
                ? "bg-accent/10 text-accent"
                : "bg-gray-100 text-gray-500";

              return (
                <article
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3.5 transition hover:border-accent/15 hover:shadow-card sm:p-4"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${activeStyle}`}
                  >
                    <PackageSearch className="h-4 w-4" />
                  </span>

                  <div className="min-w-[180px] flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-extrabold">
                        {product.name}
                      </h2>
                      {product.isTrending && (
                        <span title="Trending">
                          <Star className="h-3.5 w-3.5 fill-sunny text-sunny" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {inr(product.pricePaise)} - Stock {product.stock}
                      {product.reservedQuantity > 0 &&
                        ` (${product.reservedQuantity} in open orders)`}
                    </p>
                  </div>

                  <span className={`status-pill ${activeStyle}`}>
                    {product.isActive ? "Live" : "Hidden"}
                  </span>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="btn-ghost px-2.5 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      disabled={busyId === product.id}
                      className={`btn-ghost px-2.5 text-xs ${
                        product.isActive
                          ? "text-discount hover:text-discount"
                          : "text-accent"
                      }`}
                    >
                      {busyId === product.id ? (
                        <Spinner />
                      ) : product.isActive ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {product.isActive ? "Hide" : "Publish"}
                    </button>
                  </div>
                </article>
              );
            })}

            {cursor && (
              <div className="pt-3">
                <LoadMoreButton onClick={loadMore} loading={loadingMore} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
