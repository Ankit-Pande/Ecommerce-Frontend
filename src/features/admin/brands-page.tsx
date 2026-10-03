"use client";

import { useRef, useState } from "react";
import { ImageUp, Plus, Tags, Trash2 } from "lucide-react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Spinner } from "@/components/ui/spinner";
import { useAdminData } from "@/features/admin/use-admin-data";
import { createBrand, deleteBrand, listBrands } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { slugify } from "@/lib/format";
import type { AdminBrand } from "@/lib/types";
import { toast } from "@/store/toast-store";
import { Button } from "@/components/ui/button";

// Admin brands list and add form.
export default function AdminBrands() {
  const { data, setData, loading, failed, load } = useAdminData(listBrands);
  const brands = data ?? [];
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Saves a new brand.
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("slug", slugify(name));
      if (logo) form.append("logo", logo);

      await createBrand(form);
      setName("");
      setLogo(null);
      if (fileInput.current) fileInput.current.value = "";
      await load();
      toast.success("Brand created");
    } catch (error) {
      toast.error(errorMessage(error, "Could not create this brand"));
    } finally {
      setSaving(false);
    }
  }

  // Deletes a brand.
  async function remove(brand: AdminBrand) {
    if (!window.confirm(`Delete "${brand.name}"?`)) return;

    setBusyId(brand.id);
    try {
      await deleteBrand(brand.id);
      setData(
        (current) => current?.filter((item) => item.id !== brand.id) ?? [],
      );
      toast.success("Brand deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this brand"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <form
        onSubmit={create}
        className="rounded-2xl border border-sand p-5 dark:border-white/10 xl:sticky xl:top-32"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Plus className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-extrabold">Add brand</h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Brand name
            </span>
            <input
              className="field"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Samsung"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Logo <span className="font-medium text-gray-400">(optional)</span>
            </span>
            <span className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/15 px-3.5 text-xs font-bold text-gray-500 hover:border-accent/30 dark:border-white/20">
              <ImageUp className="h-4 w-4" />
              {logo?.name ?? "Choose logo"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>

          <Button type="submit" loading={saving} className="w-full">
            Create brand
          </Button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-extrabold">Available brands</h2>

        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
            <Tags className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No brands yet</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {brands.map((brand) => (
              <article
                key={brand.id}
                className="flex items-center gap-3 rounded-2xl border border-sand p-3.5 dark:border-white/10"
              >
                <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-mist text-accent dark:bg-white/[0.06]">
                  {brand.logo ? (
                    <SafeImage
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      sizes="44px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <Tags className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-extrabold">
                    {brand.name}
                  </h3>
                  <p className="truncate text-[11px] text-gray-400">
                    /{brand.slug}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => remove(brand)}
                  disabled={busyId === brand.id}
                  className="icon-button text-gray-400 hover:text-deal"
                  aria-label={`Delete ${brand.name}`}
                >
                  {busyId === brand.id ? (
                    <Spinner />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
