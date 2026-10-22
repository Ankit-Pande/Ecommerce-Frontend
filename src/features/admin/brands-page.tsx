"use client";

import { useRef, useState } from "react";
import { createBrand, deleteBrand, listBrands, updateBrand } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useAdminData } from "@/features/admin/use-admin-data";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { AdminBrand } from "@/lib/types";

// Brands: add with logo, rename, hide/show, delete.
export function AdminBrands() {
  const { data, setData, loading, failed, load } = useAdminData(listBrands);
  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const brands = data ?? [];

  // Puts a brand in the form for renaming (null clears the form for a new brand).
  function fillForm(brand: AdminBrand | null) {
    setEditing(brand);
    setName(brand?.name ?? "");
    setLogo(null);
    if (fileInput.current) fileInput.current.value = "";
    if (brand) nameInput.current?.focus();
  }

  // Renames the brand being edited, or adds a new one.
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateBrand(editing.id, { name: name.trim() });
      } else {
        const form = new FormData();
        form.append("name", name.trim());
        form.append("slug", slugify(name));
        if (logo) form.append("logo", logo);
        await createBrand(form);
      }
      toast.success(editing ? "Brand renamed" : "Brand added");
      fillForm(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this brand"));
    } finally {
      setSaving(false);
    }
  }

  // Hides or shows a brand in the store.
  async function toggleVisible(brand: AdminBrand) {
    setBusyId(brand.id);
    try {
      const saved = await updateBrand(brand.id, { isActive: !brand.isActive });
      setData(
        (current) =>
          current?.map((item) => (item.id === saved.id ? saved : item)) ?? [],
      );
      toast.success(saved.isActive ? "Brand is live" : "Brand hidden");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this brand"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes a brand after a confirm.
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
    <>
      <AdminTitle title="Brands" />

      <form
        onSubmit={save}
        className="flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 shadow-card"
      >
        <label className="label flex-[1_1_240px]">
          {editing ? `Rename "${editing.name}"` : "Brand name"}
          <input
            ref={nameInput}
            className="field"
            required
            minLength={2}
            maxLength={80}
            placeholder="Brand name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {!editing && (
          <label className="label flex-[1_1_200px]">
            Logo (optional)
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="field py-2.5"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            />
          </label>
        )}
        <Button type="submit" loading={saving}>
          {editing ? "Save name" : "Add brand"}
        </Button>
        {editing && (
          <Button variant="line" onClick={() => fillForm(null)}>
            Cancel
          </Button>
        )}
      </form>

      {loading && !data ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={load} />
      ) : brands.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No brands yet
        </p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Brand</span>
              <span>Link name</span>
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
                    tone={brand.isActive ? "good" : "bad"}
                    label={brand.isActive ? "Visible" : "Hidden"}
                  />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillForm(brand)}
                    className="btn-table"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisible(brand)}
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
    </>
  );
}
