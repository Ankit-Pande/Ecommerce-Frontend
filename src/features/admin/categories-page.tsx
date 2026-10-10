"use client";

import { useRef, useState } from "react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { useAdminData } from "@/features/admin/use-admin-data";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/api/admin";
import { errorMessage } from "@/api/http";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";
import { Button } from "@/components/ui/button";

// Admin category tree and add form.
export default function AdminCategories() {
  const { data, loading, failed, load } = useAdminData(listCategories);
  const categories = data ?? [];
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Saves a new category.
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("slug", slugify(name));
      if (parentId) form.append("parentId", parentId);
      if (image) form.append("image", image);

      await createCategory(form);
      setName("");
      setParentId("");
      setImage(null);
      if (fileInput.current) fileInput.current.value = "";
      await load();
      toast.success("Category created");
    } catch (error) {
      toast.error(errorMessage(error, "Could not create this category"));
    } finally {
      setSaving(false);
    }
  }

  // Deletes a category.
  async function remove(id: string, label: string) {
    if (!window.confirm(`Delete "${label}"?`)) return;

    setBusyId(id);
    try {
      await deleteCategory(id);
      await load();
      toast.success("Category deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this category"));
    } finally {
      setBusyId("");
    }
  }

  // Hides or shows a category with its products.
  async function toggleVisible(id: string, isActive: boolean) {
    setBusyId(id);
    try {
      const form = new FormData();
      form.append("isActive", String(!isActive));
      await updateCategory(id, form);
      await load();
      toast.success(isActive ? "Category hidden" : "Category visible");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this category"));
    } finally {
      setBusyId("");
    }
  }

  const rows = categories.flatMap((category) => [
    { ...category, parent: "" },
    ...category.children.map((child) => ({ ...child, parent: category.name })),
  ]);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <form
        onSubmit={create}
        className="card flex flex-[1_1_280px] flex-col gap-3 p-5 xl:max-w-[360px]"
      >
        <h2 className="text-xl font-extrabold">Add category</h2>
        <label className="flex flex-col gap-1.5 font-semibold">
          Category name
          <input
            className="field"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Laptops"
          />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Parent
          <select
            className="field"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
          >
            <option value="">None (top level)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Image (optional)
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="field py-2.5"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="submit" loading={saving} disabled={failed}>
          Add category
        </Button>
      </form>

      <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
        <p className="text-muted">
          Delete is blocked while a category has products or subcategories.
        </p>
        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : rows.length === 0 ? (
          <p className="card p-8 text-center font-semibold">
            No categories yet
          </p>
        ) : (
          <div className="table-box">
            <div className="min-w-[820px]">
              <div className="table-head">
                <span>Category</span>
                <span>Parent</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {rows.map((row) => (
                <div key={row.id} className="data-row">
                  <span className={row.parent ? "" : "font-semibold"}>
                    {row.parent ? `› ${row.name}` : row.name}
                  </span>
                  <span className="text-muted">
                    {row.parent || "Top level"}
                  </span>
                  <span>
                    <StatusPill
                      tone={row.isActive ? "green" : "red"}
                      label={row.isActive ? "Visible" : "Hidden"}
                    />
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleVisible(row.id, row.isActive)}
                      disabled={busyId === row.id}
                      className="btn-table"
                    >
                      {row.isActive ? "Hide" : "Unhide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row.id, row.name)}
                      disabled={busyId === row.id}
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
