"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, FolderTree, ImageUp, Plus, Trash2 } from "lucide-react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Spinner } from "@/components/ui/spinner";
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

export default function AdminCategories() {
  // Admin list includes hidden categories.
  const { data, loading, failed, load } = useAdminData(listCategories);
  const categories = data ?? [];
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

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

  // Hiding a parent also hides its subcategories and their products on the store.
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
          <h2 className="text-sm font-extrabold">Add category</h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Category name
            </span>
            <input
              className="field"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Electronics"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Parent
            </span>
            <select
              className="field"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">None - top level</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Category image{" "}
              <span className="font-medium text-gray-400">(optional)</span>
            </span>
            <span className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/15 px-3.5 text-xs font-bold text-gray-500 hover:border-accent/30 dark:border-white/20">
              <ImageUp className="h-4 w-4" />
              {image?.name ?? "Choose image"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>

          <Button
            type="submit"
            loading={saving}
            disabled={failed}
            className="w-full"
          >
            Create category
          </Button>
        </div>
      </form>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-extrabold">Category tree</h2>
          <p className="mt-1 text-xs text-gray-500">
            Delete is blocked while a category has products or children.
          </p>
        </div>

        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
            <FolderTree className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No categories yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-2xl border border-sand p-4 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-mist text-accent dark:bg-white/[0.06]">
                    <FolderTree className="h-4 w-4" />
                  </span>
                  <h3 className="flex-1 text-sm font-extrabold">
                    {category.name}
                    {!category.isActive && (
                      <span className="ml-2 text-[10px] text-gray-400">
                        Hidden
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      toggleVisible(category.id, category.isActive)
                    }
                    disabled={busyId === category.id}
                    className="icon-button text-gray-400 hover:text-accent"
                    aria-label={`${category.isActive ? "Hide" : "Show"} ${category.name}`}
                  >
                    {category.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(category.id, category.name)}
                    disabled={busyId === category.id}
                    className="icon-button text-gray-400 hover:text-deal"
                    aria-label={`Delete ${category.name}`}
                  >
                    {busyId === category.id ? (
                      <Spinner />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {category.children.length > 0 && (
                  <div className="ml-4 mt-3 space-y-1.5 border-l border-black/10 pl-5 dark:border-white/15">
                    {category.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex min-h-9 items-center gap-2 rounded-lg px-2 hover:bg-mist/70 dark:hover:bg-white/[0.04]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        <span className="flex-1 text-xs font-bold text-gray-600 dark:text-gray-300">
                          {child.name}
                          {!child.isActive && (
                            <span className="ml-2 text-[10px] text-gray-400">
                              Hidden
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            toggleVisible(child.id, child.isActive)
                          }
                          disabled={busyId === child.id}
                          className="icon-button h-8 w-8 text-gray-400 hover:text-accent"
                          aria-label={`${child.isActive ? "Hide" : "Show"} ${child.name}`}
                        >
                          {child.isActive ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(child.id, child.name)}
                          disabled={busyId === child.id}
                          className="icon-button h-8 w-8 text-gray-400 hover:text-deal"
                          aria-label={`Delete ${child.name}`}
                        >
                          {busyId === child.id ? (
                            <Spinner />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
