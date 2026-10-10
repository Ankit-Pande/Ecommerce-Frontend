"use client";

import { useRef, useState } from "react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { useAdminData } from "@/features/admin/use-admin-data";
import {
  createBrand,
  deleteBrand,
  listBrands,
  setBrandActive,
} from "@/api/admin";
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

  // Hides or shows a brand in filters and on product pages.
  async function toggleActive(brand: AdminBrand) {
    setBusyId(brand.id);
    try {
      const { data: saved } = await setBrandActive(brand.id, !brand.isActive);
      setData(
        (current) =>
          current?.map((item) => (item.id === saved.id ? saved : item)) ?? [],
      );
      toast.success(saved.isActive ? "Brand visible" : "Brand hidden");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this brand"));
    } finally {
      setBusyId("");
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
    <div className="flex flex-wrap items-start gap-6">
      <form
        onSubmit={create}
        className="card flex flex-[1_1_280px] flex-col gap-3 p-5 xl:max-w-[360px]"
      >
        <h2 className="text-xl font-extrabold">Add brand</h2>
        <label className="flex flex-col gap-1.5 font-semibold">
          Brand name
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
        <label className="flex flex-col gap-1.5 font-semibold">
          Logo (optional)
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="field py-2.5"
            onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="submit" loading={saving}>
          Add brand
        </Button>
      </form>

      <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : brands.length === 0 ? (
          <p className="card p-8 text-center font-semibold">No brands yet</p>
        ) : (
          <div className="table-box">
            <div className="min-w-[820px]">
              <div className="table-head">
                <span>Brand</span>
                <span>Slug</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {brands.map((brand) => (
                <div key={brand.id} className="data-row">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-ground">
                      <SafeImage
                        src={brand.logo}
                        alt=""
                        sizes="40px"
                        className="object-contain p-1"
                      />
                    </span>
                    <span className="truncate">{brand.name}</span>
                  </span>
                  <span className="truncate text-muted">{brand.slug}</span>
                  <span>
                    <StatusPill
                      tone={brand.isActive ? "green" : "red"}
                      label={brand.isActive ? "Visible" : "Hidden"}
                    />
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(brand)}
                      disabled={busyId === brand.id}
                      className="btn-table"
                    >
                      {brand.isActive ? "Hide" : "Unhide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(brand)}
                      disabled={busyId === brand.id}
                      className="btn-table text-danger"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
