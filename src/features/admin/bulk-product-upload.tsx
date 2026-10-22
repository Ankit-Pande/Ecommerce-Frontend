"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkCreateProducts, uploadImages } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useProductOptions } from "@/features/admin/use-product-options";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";

const MAX_ROWS = 50;

type Row = {
  id: string;
  name: string;
  price: string;
  stock: string;
  discountPercent: string;
  categoryId: string;
  brandId: string;
  colors: string;
  sizes: string;
  description: string;
  images: string[];
  uploading: boolean;
};

// A blank product row.
function emptyRow(): Row {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    stock: "0",
    discountPercent: "0",
    categoryId: "",
    brandId: "",
    colors: "",
    sizes: "",
    description: "",
    images: [],
    uploading: false,
  };
}

// Add up to 50 products at once, one row each, with images uploaded per row.
export function BulkProductUpload() {
  const router = useRouter();
  const options = useProductOptions();
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [saving, setSaving] = useState(false);
  const uploading = rows.some((row) => row.uploading);

  // Changes some fields of one row.
  function updateRow(index: number, change: Partial<Row>) {
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...change } : row,
      ),
    );
  }

  // Uploads up to 6 images for a row and keeps their URLs.
  async function uploadRowImages(index: number, files: FileList | null) {
    if (!files?.length) return;
    updateRow(index, { uploading: true });
    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, 6)
        .forEach((file) => form.append("images", file));
      updateRow(index, { images: await uploadImages(form), uploading: false });
    } catch (error) {
      updateRow(index, { uploading: false });
      toast.error(errorMessage(error, "Image upload failed"));
    }
  }

  // Checks the filled rows and creates them; existing slugs are skipped.
  async function createAll() {
    const filled = rows.filter((row) => row.name.trim());
    if (filled.length === 0) {
      toast.error("Fill at least one product");
      return;
    }
    const incomplete = filled.find(
      (row) =>
        !(Number(row.price) > 0) ||
        !row.categoryId ||
        row.images.length === 0 ||
        row.description.trim().length < 5,
    );
    if (incomplete) {
      toast.error(
        `"${incomplete.name}" needs a price, a category, an image and a description of 5+ letters`,
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
          colors: row.colors,
          sizes: row.sizes,
        })),
      );
      toast.success(
        skipped.length > 0
          ? `${created} added, ${skipped.length} skipped (already exist)`
          : `${created} products added`,
      );
      router.push("/admin/products");
    } catch (error) {
      toast.error(errorMessage(error, "Could not add the products"));
      setSaving(false);
    }
  }

  return (
    <>
      <AdminTitle title="Bulk upload">
        <Link href="/admin/products" className="btn-line">
          ‹ Products
        </Link>
        <Button
          variant="outline"
          onClick={() => setRows((current) => [...current, emptyRow()])}
          disabled={rows.length >= MAX_ROWS || saving}
        >
          + Add row
        </Button>
      </AdminTitle>
      <p className="text-muted">
        Up to {MAX_ROWS} products at once. Each needs at least one image.
      </p>

      {options.failed && (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFD9D9] p-3 font-semibold text-[#8E1B1B]">
          Could not load categories.
          <button type="button" onClick={options.reload} className="btn-table">
            Retry
          </button>
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="card grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            className="field lg:col-span-2"
            placeholder={`Product ${index + 1} name`}
            aria-label={`Product ${index + 1} name`}
            value={row.name}
            onChange={(event) => updateRow(index, { name: event.target.value })}
          />
          <input
            className="field"
            placeholder="Price ₹"
            aria-label="Price"
            inputMode="decimal"
            value={row.price}
            onChange={(event) =>
              updateRow(index, {
                price: event.target.value.replace(/[^\d.]/g, ""),
              })
            }
          />
          <input
            className="field"
            placeholder="Stock"
            aria-label="Stock"
            inputMode="numeric"
            value={row.stock}
            onChange={(event) =>
              updateRow(index, { stock: event.target.value.replace(/\D/g, "") })
            }
          />
          <select
            className="field"
            aria-label="Category"
            disabled={options.loading}
            value={row.categoryId}
            onChange={(event) =>
              updateRow(index, { categoryId: event.target.value })
            }
          >
            <option value="">Category</option>
            {options.categories.map((category) => (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>{category.name}</option>
                {category.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {category.name} › {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            className="field"
            aria-label="Brand"
            disabled={options.loading}
            value={row.brandId}
            onChange={(event) =>
              updateRow(index, { brandId: event.target.value })
            }
          >
            <option value="">No brand</option>
            {options.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <input
            className="field"
            placeholder="Colours (Black, Blue)"
            aria-label="Colours"
            value={row.colors}
            onChange={(event) =>
              updateRow(index, { colors: event.target.value })
            }
          />
          <input
            className="field"
            placeholder="Sizes (S, M, L)"
            aria-label="Sizes"
            value={row.sizes}
            onChange={(event) =>
              updateRow(index, { sizes: event.target.value })
            }
          />
          <input
            className="field"
            placeholder="Discount % (0 to 90)"
            aria-label="Discount percent"
            inputMode="numeric"
            value={row.discountPercent}
            onChange={(event) =>
              updateRow(index, {
                discountPercent: String(
                  Math.min(
                    90,
                    Number(event.target.value.replace(/\D/g, "")) || 0,
                  ),
                ),
              })
            }
          />
          <input
            className="field sm:col-span-2 lg:col-span-3"
            placeholder="Description (5+ letters)"
            aria-label="Description"
            value={row.description}
            onChange={(event) =>
              updateRow(index, { description: event.target.value })
            }
          />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label={`Images for product ${index + 1}`}
              disabled={row.uploading || saving}
              onChange={(event) => uploadRowImages(index, event.target.files)}
              className="text-sm"
            />
            {row.uploading && <Spinner />}
            {row.images.length > 0 && (
              <span className="text-sm font-extrabold text-accent">
                {row.images.length} image(s) uploaded
              </span>
            )}
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setRows((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
                disabled={uploading || saving}
                className="btn-remove ml-auto"
              >
                Remove row
              </button>
            )}
          </div>
        </div>
      ))}

      <Button
        onClick={createAll}
        loading={saving}
        disabled={uploading || options.loading || options.failed}
        className="self-start px-8"
      >
        {uploading ? "Uploading images…" : "Add all products"}
      </Button>
    </>
  );
}
