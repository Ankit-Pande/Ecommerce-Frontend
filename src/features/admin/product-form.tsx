"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useProductOptions } from "@/features/admin/use-product-options";
import { createProduct, updateProduct } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 6;
const GENDERS = ["Men", "Women", "Unisex"];
const AGE_GROUPS = ["Adult", "Kids"];

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  discountPercent: string;
  offerEndsAt: string;
  stock: string;
  categoryId: string;
  brandId: string;
  color: string;
  gender: string;
  ageGroup: string;
  specs: string;
  isTrending: boolean;
  isFeatured: boolean;
  isActive: boolean;
};

export const emptyProduct: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  discountPercent: "0",
  offerEndsAt: "",
  stock: "0",
  categoryId: "",
  brandId: "",
  color: "",
  gender: "",
  ageGroup: "",
  specs: "",
  isTrending: false,
  isFeatured: false,
  isActive: true,
};

type ProductFormProps = {
  productId?: string;
  initial: ProductFormValues;
  existingImageCount?: number;
};

// Create and edit product form.
export function ProductForm({
  productId,
  initial,
  existingImageCount = 0,
}: ProductFormProps) {
  const [values, setValues] = useState(initial);
  const [images, setImages] = useState<FileList | null>(null);
  const [slugEdited, setSlugEdited] = useState(Boolean(productId));
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

  // Updates one form field.
  function setField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Updates the name and the slug together.
  function changeName(name: string) {
    setValues((current) => ({
      ...current,
      name,
      ...(!slugEdited && { slug: slugify(name) }),
    }));
  }

  // Validates and saves the product.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (failed) {
      toast.error("Load categories before saving");
      return;
    }

    if (!productId && !images?.length) {
      toast.error("Choose at least one product image");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", values.name.trim());
      form.append("slug", values.slug);
      form.append("description", values.description.trim());
      form.append("pricePaise", String(Math.round(Number(values.price) * 100)));
      form.append("discountPercent", values.discountPercent || "0");
      form.append("stock", values.stock || "0");
      form.append("categoryId", values.categoryId);
      form.append("isTrending", String(values.isTrending));
      form.append("isFeatured", String(values.isFeatured));
      form.append("brandId", values.brandId);
      form.append("color", values.color.trim());
      form.append("gender", values.gender);
      form.append("ageGroup", values.ageGroup);
      form.append("specs", values.specs);
      form.append(
        "offerEndsAt",
        values.offerEndsAt ? new Date(values.offerEndsAt).toISOString() : "",
      );
      if (productId) form.append("isActive", String(values.isActive));

      Array.from(images ?? [])
        .slice(0, MAX_IMAGES)
        .forEach((file) => form.append("images", file));

      if (productId) await updateProduct(productId, form);
      else await createProduct(form);

      toast.success(productId ? "Product updated" : "Product created");
      router.push("/admin/products");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save product"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid max-w-3xl gap-5 rounded-2xl border border-line p-5 sm:grid-cols-2 sm:p-6"
    >
      {failed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-discount/10 p-3 text-xs font-bold text-discount sm:col-span-2">
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-100 p-3 text-xs font-bold text-amber-800 sm:col-span-2">
          <span>Brands are unavailable. You can save without a brand.</span>
          <Button
            variant="ghost"
            onClick={reloadBrands}
            className="min-h-9 py-1 text-amber-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-gray-500">Product name</span>
        <input
          className="field mt-1"
          required
          minLength={2}
          value={values.name}
          onChange={(event) => changeName(event.target.value)}
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-gray-500">Slug (URL)</span>
        <input
          className="field mt-1"
          required
          value={values.slug}
          onChange={(event) => {
            setSlugEdited(true);
            setField("slug", slugify(event.target.value));
          }}
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-gray-500">Description</span>
        <textarea
          className="field mt-1"
          rows={4}
          required
          minLength={5}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-gray-500">
          Specs (one per line, like RAM: 16GB)
        </span>
        <textarea
          className="field mt-1"
          rows={3}
          placeholder={"RAM: 16GB\nBattery: 5000mAh"}
          value={values.specs}
          onChange={(event) => setField("specs", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Price (INR)</span>
        <input
          className="field mt-1"
          required
          inputMode="decimal"
          value={values.price}
          onChange={(event) =>
            setField("price", event.target.value.replace(/[^\d.]/g, ""))
          }
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Discount %</span>
        <input
          className="field mt-1"
          inputMode="numeric"
          value={values.discountPercent}
          onChange={(event) => {
            setField(
              "discountPercent",
              event.target.value.replace(/\D/g, "").slice(0, 2),
            );
          }}
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">
          Offer ends (optional)
        </span>
        <input
          type="datetime-local"
          className="field mt-1"
          value={values.offerEndsAt}
          onChange={(event) => setField("offerEndsAt", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Stock</span>
        <input
          className="field mt-1"
          inputMode="numeric"
          value={values.stock}
          onChange={(event) =>
            setField("stock", event.target.value.replace(/\D/g, ""))
          }
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Colour</span>
        <input
          className="field mt-1"
          placeholder="e.g. black"
          value={values.color}
          onChange={(event) => setField("color", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Gender</span>
        <select
          className="field mt-1"
          value={values.gender}
          onChange={(event) => setField("gender", event.target.value)}
        >
          <option value="">Not set</option>
          {GENDERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Age group</span>
        <select
          className="field mt-1"
          value={values.ageGroup}
          onChange={(event) => setField("ageGroup", event.target.value)}
        >
          <option value="">Not set</option>
          {AGE_GROUPS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">Category</span>
        <select
          className="field mt-1"
          required
          disabled={loading}
          value={values.categoryId}
          onChange={(event) => setField("categoryId", event.target.value)}
        >
          <option value="">
            {loading ? "Loading categories..." : "Select category"}
          </option>
          {failed && values.categoryId && (
            <option value={values.categoryId}>Current category</option>
          )}
          {categories.map((category) => (
            <optgroup key={category.id} label={category.name}>
              <option value={category.id}>{category.name}</option>
              {category.children.map((child) => (
                <option key={child.id} value={child.id}>
                  - {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label>
        <span className="text-xs font-bold text-gray-500">
          Brand (optional)
        </span>
        <select
          className="field mt-1"
          disabled={brandsLoading}
          value={values.brandId}
          onChange={(event) => setField("brandId", event.target.value)}
        >
          <option value="">
            {brandsLoading ? "Loading brands..." : "No brand"}
          </option>
          {brandsFailed && values.brandId && (
            <option value={values.brandId}>Current brand</option>
          )}
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-gray-500">
          Images (up to {MAX_IMAGES}, 2 MB each)
        </span>
        {existingImageCount > 0 && (
          <span className="mt-1 block text-xs text-gray-500">
            {existingImageCount} image(s) uploaded. New files will replace them.
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          className="mt-1.5 block text-sm"
          onChange={(event) => setImages(event.target.files)}
        />
      </label>

      <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="accent-accent"
          checked={values.isTrending}
          onChange={(event) => setField("isTrending", event.target.checked)}
        />
        Show in Trending
      </label>

      <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="accent-accent"
          checked={values.isFeatured}
          onChange={(event) => setField("isFeatured", event.target.checked)}
        />
        Show in Featured
      </label>

      {productId && (
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-accent"
            checked={values.isActive}
            onChange={(event) => setField("isActive", event.target.checked)}
          />
          Live on store
        </label>
      )}

      <div className="sm:col-span-2">
        <Button
          type="submit"
          loading={saving}
          disabled={loading || failed}
          className="px-7"
        >
          {productId ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
