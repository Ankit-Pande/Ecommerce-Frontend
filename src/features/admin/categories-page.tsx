"use client";

import { useRef, useState } from "react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useAdminData } from "@/features/admin/use-admin-data";
import { slugify } from "@/lib/format";
import { toast } from "@/store/toast-store";

type Row = {
  id: string;
  name: string;
  isActive: boolean;
  parentId: string;
  parentName: string;
  hasChildren: boolean;
};

// Categories and subcategories: add, rename, change image, hide/show, delete.
export function AdminCategories() {
  const { data, loading, failed, load } = useAdminData(listCategories);
  const [editing, setEditing] = useState<Row | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const categories = data ?? [];
  const rows: Row[] = categories.flatMap((category) => [
    {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      parentId: "",
      parentName: "",
      hasChildren: category.children.length > 0,
    },
    ...category.children.map((child) => ({
      id: child.id,
      name: child.name,
      isActive: child.isActive,
      parentId: category.id,
      parentName: category.name,
      hasChildren: false,
    })),
  ]);

  // Puts a category in the form for editing, or prepares a new one under `parent`.
  function fillForm(row: Row | null, parent: string) {
    setEditing(row);
    setName(row?.name ?? "");
    setParentId(parent);
    setImage(null);
    if (fileInput.current) fileInput.current.value = "";
    nameInput.current?.focus();
  }

  // Saves the edited category, or adds a new one.
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      if (image) form.append("image", image);
      if (editing) {
        await updateCategory(editing.id, form);
      } else {
        form.append("slug", slugify(name));
        if (parentId) form.append("parentId", parentId);
        await createCategory(form);
      }
      toast.success(editing ? "Category saved" : "Category added");
      fillForm(null, "");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this category"));
    } finally {
      setSaving(false);
    }
  }

  // Hides or shows a category in the store.
  async function toggleVisible(row: Row) {
    setBusyId(row.id);
    try {
      const form = new FormData();
      form.append("isActive", String(!row.isActive));
      await updateCategory(row.id, form);
      toast.success(
        row.isActive ? "Category hidden from the store" : "Category is live",
      );
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this category"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes a category after a confirm.
  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    setBusyId(row.id);
    try {
      await deleteCategory(row.id);
      toast.success("Category deleted");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this category"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <AdminTitle title="Categories" />

      <form
        onSubmit={save}
        className="flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 shadow-card"
      >
        <label className="label flex-[1_1_240px]">
          {editing ? `Rename "${editing.name}"` : "New category name"}
          <input
            ref={nameInput}
            className="field"
            required
            minLength={2}
            maxLength={80}
            placeholder="Category name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="label flex-[1_1_200px]">
          Parent
          <select
            className="field"
            disabled={Boolean(editing)}
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
        <label className="label flex-[1_1_200px]">
          Image (optional)
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field py-2.5"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="submit" loading={saving} disabled={failed}>
          {editing ? "Save changes" : "Add category"}
        </Button>
        {editing && (
          <Button variant="line" onClick={() => fillForm(null, "")}>
            Cancel
          </Button>
        )}
        <p className="w-full text-muted">
          The store shows only the visible categories in this list. A category
          with products or subcategories cannot be deleted; hide it instead.
        </p>
      </form>

      {loading && !data ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={load} />
      ) : rows.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No categories yet
        </p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Category</span>
              <span>Parent</span>
              <span>Status</span>
              <span className="flex-[2]">Actions</span>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="data-row">
                <span>
                  <span className={row.parentId ? "ml-4" : "font-semibold"}>
                    {row.parentId ? `› ${row.name}` : row.name}
                  </span>
                </span>
                <span className="text-muted">
                  {row.parentName || "Top level"}
                </span>
                <span>
                  <StatusPill
                    tone={row.isActive ? "good" : "bad"}
                    label={row.isActive ? "Visible" : "Hidden"}
                  />
                </span>
                <span className="flex flex-[2] flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillForm(row, row.parentId)}
                    className="btn-table"
                  >
                    Edit
                  </button>
                  {!row.parentId && (
                    <button
                      type="button"
                      onClick={() => fillForm(null, row.id)}
                      className="btn-table"
                    >
                      Add subcategory
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleVisible(row)}
                    disabled={busyId === row.id}
                    className="btn-table"
                  >
                    {row.isActive ? "Hide" : "Unhide"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    disabled={busyId === row.id || row.hasChildren}
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
