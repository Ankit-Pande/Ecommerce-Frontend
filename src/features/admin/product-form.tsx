"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useProductOptions } from "@/features/admin/use-product-options";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminProductDetail } from "@/lib/types";

const MAX_IMAGES = 6;

type FormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  discountPercent: string;
  offerEndsAt: string;
  stock: string;
  categoryId: string;
  brandId: string;
  colors: string;
  sizes: string;
  gender: string;
  ageGroup: string;
  specs: string;
  isTrending: boolean;
  isFeatured: boolean;
  isActive: boolean;
};

// An ISO date as a local "yyyy-mm-ddThh:mm" value for a datetime input.
function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

// The form's first values: the product's fields, or blanks for a new product.
function startValues(product?: AdminProductDetail): FormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? String(product.pricePaise / 100) : "",
    discountPercent: String(product?.discountPercent ?? 0),
    offerEndsAt: product?.offerEndsAt ? toLocalInput(product.offerEndsAt) : "",
    stock: String(product?.stock ?? 0),
    categoryId: product?.categoryId ?? "",
    brandId: product?.brandId ?? "",
    colors: product?.colors.join(", ") ?? "",
    sizes: product?.sizes.join(", ") ?? "",
    gender: product?.gender ?? "",
    ageGroup: product?.ageGroup ?? "",
    specs: Object.entries(product?.specs ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
    isTrending: product?.isTrending ?? false,
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive ?? true,
  };
}

// Form values as the text fields the API takes (price in paise).
function toFields(
  values: FormValues,
  editing: boolean,
): Record<string, string> {
  return {
    name: values.name.trim(),
    slug: values.slug,
    description: values.description.trim(),
    pricePaise: String(Math.round(Number(values.price) * 100)),
    discountPercent: values.discountPercent || "0",
    stock: values.stock || "0",
    categoryId: values.categoryId,
    brandId: values.brandId,
    colors: values.colors,
    sizes: values.sizes,
    gender: values.gender,
    ageGroup: values.ageGroup,
    specs: values.specs,
    offerEndsAt: values.offerEndsAt
      ? new Date(values.offerEndsAt).toISOString()
      : "",
    isTrending: String(values.isTrending),
    isFeatured: String(values.isFeatured),
    ...(editing && { isActive: String(values.isActive) }),
  };
}

// Add or edit form for one product; on edit only the changed fields are sent.
export function ProductForm({ product }: { product?: AdminProductDetail }) {
  const router = useRouter();
  const options = useProductOptions();
  const [values, setValues] = useState(() => startValues(product));
  const [images, setImages] = useState<File[]>([]);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [saving, setSaving] = useState(false);

  // Changes one form value.
  function setField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Sends the new product, or only the changed fields of an existing one.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product && images.length === 0) {
      toast.error("Choose at least one product image");
      return;
    }

    const fields = toFields(values, Boolean(product));
    const saved: Record<string, string> = product
      ? toFields(startValues(product), true)
      : {};
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (!product || saved[key] !== value) form.append(key, value);
    }
    images.forEach((file) => form.append("images", file));
    if (product && [...form.keys()].length === 0) {
      toast.error("Nothing changed");
      return;
    }

    setSaving(true);
    try {
      if (product) await updateProduct(product.id, form);
      else await createProduct(form);
      toast.success(product ? "Product saved" : "Product added");
      router.push("/admin/products");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the product"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card grid max-w-3xl gap-4 p-5 sm:grid-cols-2 sm:p-6"
    >
      {options.failed && (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFD9D9] p-3 font-semibold text-[#8E1B1B] sm:col-span-2">
          Could not load categories.
          <button type="button" onClick={options.reload} className="btn-table">
            Retry
          </button>
        </p>
      )}

      <label className="label sm:col-span-2">
        Product name
        <input
          className="field"
          required
          minLength={2}
          maxLength={150}
          value={values.name}
          onChange={(event) => {
            const name = event.target.value;
            setValues((current) => ({
              ...current,
              name,
              ...(!slugTouched && { slug: slugify(name) }),
            }));
          }}
        />
      </label>

      <label className="label sm:col-span-2">
        Link name (slug)
        <input
          className="field"
          required
          maxLength={120}
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            setField("slug", slugify(event.target.value));
          }}
        />
      </label>

      <label className="label sm:col-span-2">
        Description
        <textarea
          className="field py-2.5"
          rows={4}
          required
          minLength={5}
          maxLength={5000}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </label>

      <label className="label sm:col-span-2">
        Specs (one per line, like RAM: 8GB)
        <textarea
          className="field py-2.5"
          rows={3}
          placeholder={"RAM: 8GB\nBattery: 5000mAh"}
          value={values.specs}
          onChange={(event) => setField("specs", event.target.value)}
        />
      </label>

      <label className="label">
        Price (₹)
        <input
          className="field"
          required
          inputMode="decimal"
          value={values.price}
          onChange={(event) =>
            setField("price", event.target.value.replace(/[^\d.]/g, ""))
          }
        />
      </label>

      <label className="label">
        Discount % (0 to 90)
        <input
          className="field"
          type="number"
          min={0}
          max={90}
          value={values.discountPercent}
          onChange={(event) => setField("discountPercent", event.target.value)}
        />
      </label>

      <label className="label">
        Offer ends (optional)
        <input
          type="datetime-local"
          className="field"
          value={values.offerEndsAt}
          onChange={(event) => setField("offerEndsAt", event.target.value)}
        />
      </label>

      <label className="label">
        Stock
        <input
          className="field"
          type="number"
          min={0}
          max={100000}
          value={values.stock}
          onChange={(event) => setField("stock", event.target.value)}
        />
      </label>

      <label className="label">
        Colours (comma separated)
        <input
          className="field"
          placeholder="Black, Navy Blue"
          value={values.colors}
          onChange={(event) => setField("colors", event.target.value)}
        />
      </label>

      <label className="label">
        Sizes (comma separated)
        <input
          className="field"
          placeholder="S, M, L, XL"
          value={values.sizes}
          onChange={(event) => setField("sizes", event.target.value)}
        />
      </label>

      <label className="label">
        Gender
        <select
          className="field"
          value={values.gender}
          onChange={(event) => setField("gender", event.target.value)}
        >
          <option value="">Not set</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Unisex">Unisex</option>
        </select>
      </label>

      <label className="label">
        Age group
        <select
          className="field"
          value={values.ageGroup}
          onChange={(event) => setField("ageGroup", event.target.value)}
        >
          <option value="">Not set</option>
          <option value="Adult">Adult</option>
          <option value="Kids">Kids</option>
        </select>
      </label>

      <label className="label">
        Category
        <select
          className="field"
          required
          disabled={options.loading}
          value={values.categoryId}
          onChange={(event) => setField("categoryId", event.target.value)}
        >
          <option value="">
            {options.loading ? "Loading…" : "Choose category"}
          </option>
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
      </label>

      <label className="label">
        Brand (optional)
        <select
          className="field"
          disabled={options.loading}
          value={values.brandId}
          onChange={(event) => setField("brandId", event.target.value)}
        >
          <option value="">No brand</option>
          {options.brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>

      <label className="label sm:col-span-2">
        Images (up to {MAX_IMAGES}, 2 MB each)
        {product && product.images.length > 0 && (
          <span className="text-sm font-normal text-muted">
            {product.images.length} image(s) saved. New files replace them.
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="field py-2.5"
          onChange={(event) =>
            setImages(Array.from(event.target.files ?? []).slice(0, MAX_IMAGES))
          }
        />
      </label>

      <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
        <Checkbox
          label="Show in Trending"
          checked={values.isTrending}
          onChange={(checked) => setField("isTrending", checked)}
        />
        <Checkbox
          label="Show in Featured"
          checked={values.isFeatured}
          onChange={(checked) => setField("isFeatured", checked)}
        />
        {product && (
          <Checkbox
            label="Live on store"
            checked={values.isActive}
            onChange={(checked) => setField("isActive", checked)}
          />
        )}
      </div>

      <div className="sm:col-span-2">
        <Button
          type="submit"
          loading={saving}
          disabled={options.loading || options.failed}
        >
          {product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}

// A labelled checkbox.
function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 font-semibold">
      <input
        type="checkbox"
        className="h-5 w-5 accent-accent"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
