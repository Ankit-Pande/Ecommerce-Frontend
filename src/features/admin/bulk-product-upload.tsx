"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useProductOptions } from "@/features/admin/use-product-options";
import { bulkCreateProducts, uploadImages } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const MAX_ROWS = 50;
const MAX_IMAGES_PER_ROW = 6;
const STARTING_ROWS = 1;
const MIN_DESCRIPTION_LENGTH = 5;

type Row = {
  name: string;
  price: string;
  stock: string;
  discountPercent: string;
  categoryId: string;
  brandId: string;
  color: string;
  description: string;
  images: string[];
  uploading: boolean;
};

// Blank row for the bulk form.
function emptyRow(): Row {
  return {
    name: "",
    price: "",
    stock: "0",
    discountPercent: "0",
    categoryId: "",
    brandId: "",
    color: "",
    description: "",
    images: [],
    uploading: false,
  };
}

// Add many products at once.
export default function BulkUpload() {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: STARTING_ROWS }, emptyRow),
  );
  const [saving, setSaving] = useState(false);
  const {
    categories,
    brands,
    loading,
    brandsLoading,
    failed,
    brandsFailed,
    reloadCategories,
    reloadBrands,
  } = useProductOptions();
  const router = useRouter();
  const anyUploading = rows.some((row) => row.uploading);

  // Changes one field of a row.
  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  // Uploads the images of one row.
  async function uploadRowImages(index: number, files: FileList | null) {
    if (!files?.length) return;
    updateRow(index, { uploading: true });

    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, MAX_IMAGES_PER_ROW)
        .forEach((file) => form.append("images", file));

      const urls = await uploadImages(form);
      updateRow(index, { images: urls, uploading: false });
    } catch (err) {
      updateRow(index, { uploading: false });
      toast.error(errorMessage(err, "Image upload failed"));
    }
  }

  // Uploads images, then creates all products.
  async function createAll() {
    if (anyUploading) {
      toast.error("Wait for image uploads to finish");
      return;
    }

    if (failed) {
      toast.error("Load categories before creating products");
      return;
    }

    const filled = rows.filter((row) => row.name.trim());
    if (filled.length === 0) {
      toast.error("Fill at least one product row");
      return;
    }

    const invalid = filled.find(
      (row) =>
        !(Number(row.price) > 0) ||
        !row.categoryId ||
        row.images.length === 0 ||
        row.description.trim().length < MIN_DESCRIPTION_LENGTH,
    );
    if (invalid) {
      toast.error(
        `"${invalid.name}" needs a price, a category, an image and a description of at least ${MIN_DESCRIPTION_LENGTH} characters`,
      );
      return;
    }

    setSaving(true);
    try {
      const { created, skipped } = await bulkCreateProducts(
        filled.map((row) => ({
          name: row.name.trim(),
          slug: slugify(row.name),
          description: row.description.trim(),
          pricePaise: Math.round(Number(row.price) * 100),
          discountPercent: Number(row.discountPercent || 0),
          stock: Number(row.stock || 0),
          categoryId: row.categoryId,
          images: row.images,
          ...(row.brandId && { brandId: row.brandId }),
          ...(row.color.trim() && { color: row.color.trim().toLowerCase() }),
        })),
      );

      toast.success(
        `${created} product(s) created` +
          (skipped.length
            ? ` - ${skipped.length} skipped because they already exist`
            : ""),
      );
      router.push("/admin/products");
    } catch (err) {
      toast.error(errorMessage(err, "Bulk create failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">Bulk upload</h2>
          <p className="text-xs text-gray-500">
            Up to {MAX_ROWS} products at once.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setRows((prev) =>
              prev.length < MAX_ROWS ? [...prev, emptyRow()] : prev,
            )
          }
          disabled={rows.length >= MAX_ROWS || anyUploading || saving}
          className="px-4 py-2"
        >
          <Plus className="h-4 w-4" /> Add row
        </Button>
      </div>

      {failed && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-discount/10 p-3 text-xs font-bold text-discount">
          <span>Could not load categories.</span>
          <Button
            variant="danger"
            onClick={reloadCategories}
            className="min-h-9 py-1"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {brandsFailed && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-100 p-3 text-xs font-bold text-amber-800">
          <span>
            Brands are unavailable. Products can still be created without a
            brand.
          </span>
          <Button
            variant="ghost"
            onClick={reloadBrands}
            className="min-h-9 py-1 text-amber-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="card relative grid gap-2.5 p-3.5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setRows((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
                disabled={anyUploading || saving}
                aria-label={`Remove product row ${index + 1}`}
                className="icon-button absolute right-2 top-2 z-10 h-8 w-8 bg-white text-gray-400 shadow-sm hover:text-discount"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <input
              className="field py-2 pr-10 lg:col-span-2"
              placeholder={`Product ${index + 1} name`}
              value={row.name}
              onChange={(e) => updateRow(index, { name: e.target.value })}
            />
            <input
              className="field py-2"
              placeholder="Price ₹"
              inputMode="decimal"
              value={row.price}
              onChange={(e) =>
                updateRow(index, {
                  price: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
            />
            <input
              className="field py-2"
              placeholder="Stock"
              inputMode="numeric"
              value={row.stock}
              onChange={(e) =>
                updateRow(index, { stock: e.target.value.replace(/\D/g, "") })
              }
            />
            <select
              className="field py-2"
              aria-label="Category"
              disabled={loading || failed || saving}
              value={row.categoryId}
              onChange={(e) => updateRow(index, { categoryId: e.target.value })}
            >
              <option value="">Category *</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  <option value={category.id}>{category.name}</option>
                  {category.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      — {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              className="field py-2"
              aria-label="Brand"
              disabled={brandsLoading || saving}
              value={row.brandId}
              onChange={(e) => updateRow(index, { brandId: e.target.value })}
            >
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input
              className="field py-2"
              placeholder="Colour"
              value={row.color}
              onChange={(e) => updateRow(index, { color: e.target.value })}
            />
            <input
              className="field py-2"
              placeholder="Discount %"
              inputMode="numeric"
              value={row.discountPercent}
              onChange={(e) =>
                updateRow(index, {
                  discountPercent: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 2),
                })
              }
            />
            <input
              className="field py-2 sm:col-span-2 lg:col-span-4"
              placeholder={`Description (min ${MIN_DESCRIPTION_LENGTH} characters)`}
              value={row.description}
              onChange={(e) =>
                updateRow(index, { description: e.target.value })
              }
            />

            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label={`Images for product ${index + 1}`}
                className="text-sm"
                disabled={row.uploading || saving}
                onChange={(e) => uploadRowImages(index, e.target.files)}
              />
              {row.uploading && <Spinner />}
              {row.images.length > 0 && (
                <span className="text-xs font-bold text-accent">
                  Uploaded: {row.images.length} image(s)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={createAll}
        loading={saving}
        disabled={anyUploading || loading || failed}
        className="mt-5 px-8 py-3"
      >
        {anyUploading ? "Uploading images..." : "Create all products"}
      </Button>
    </div>
  );
}
