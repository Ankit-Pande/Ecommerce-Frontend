"use client";

import { useRef, useState } from "react";
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
} from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useAdminData } from "@/features/admin/use-admin-data";
import { safeLink } from "@/lib/links";
import { toast } from "@/store/toast-store";
import type { AdminBanner } from "@/lib/types";

// Home carousel slides: add, edit link and position, hide/show, delete.
export function AdminBanners() {
  const { data, setData, loading, failed, load } = useAdminData(listBanners);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [position, setPosition] = useState("0");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const banners = data ?? [];

  // Puts a slide in the form for editing (null clears the form for a new slide).
  function fillForm(banner: AdminBanner | null) {
    setEditing(banner);
    setLink(banner?.link ?? "");
    setPosition(String(banner?.position ?? 0));
    setImage(null);
    if (fileInput.current) fileInput.current.value = "";
    if (banner) linkInput.current?.focus();
  }

  // Saves the edited slide, or adds a new one with its image.
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const opens = link.trim();
    if (opens && !safeLink(opens)) {
      toast.error("Use a link like /products?category=mobiles or https://…");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBanner(editing.id, {
          link: opens || null,
          position: Number(position || 0),
        });
      } else if (image) {
        const form = new FormData();
        form.append("image", image);
        form.append("position", position || "0");
        if (opens) form.append("link", opens);
        await createBanner(form);
      }
      toast.success(editing ? "Slide saved" : "Slide added");
      fillForm(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this slide"));
    } finally {
      setSaving(false);
    }
  }

  // Hides or shows a slide on the home page.
  async function toggleVisible(banner: AdminBanner) {
    setBusyId(banner.id);
    try {
      const saved = await updateBanner(banner.id, {
        isActive: !banner.isActive,
      });
      setData(
        (current) =>
          current?.map((item) => (item.id === saved.id ? saved : item)) ?? [],
      );
      toast.success(saved.isActive ? "Slide is live" : "Slide hidden");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this slide"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes a slide after a confirm.
  async function remove(banner: AdminBanner) {
    if (!window.confirm("Delete this slide?")) return;
    setBusyId(banner.id);
    try {
      await deleteBanner(banner.id);
      setData(
        (current) => current?.filter((item) => item.id !== banner.id) ?? [],
      );
      toast.success("Slide deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this slide"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <AdminTitle title="Carousel slides" />

      <form
        onSubmit={save}
        className="flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 shadow-card"
      >
        {editing ? (
          <span className="relative block h-14 w-40 shrink-0 overflow-hidden rounded-xl bg-ground">
            <SafeImage
              src={editing.image}
              alt="Slide being edited"
              sizes="160px"
              className="object-cover"
            />
          </span>
        ) : (
          <label className="label flex-[1_1_220px]">
            Slide image
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="field py-2.5"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </label>
        )}
        <label className="label flex-[1_1_260px]">
          Opens (optional)
          <input
            ref={linkInput}
            className="field"
            placeholder="/products?category=mobiles"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
        </label>
        <label className="label flex-[0_1_140px]">
          Order
          <input
            className="field"
            inputMode="numeric"
            value={position}
            onChange={(event) =>
              setPosition(event.target.value.replace(/\D/g, ""))
            }
          />
        </label>
        <Button type="submit" loading={saving}>
          {editing ? "Save slide" : "Add slide"}
        </Button>
        {editing && (
          <Button variant="line" onClick={() => fillForm(null)}>
            Cancel
          </Button>
        )}
        <p className="w-full text-muted">
          The home page updates within a few minutes.
        </p>
      </form>

      {loading && !data ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={load} />
      ) : banners.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No slides yet
        </p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Slide</span>
              <span>Opens</span>
              <span>Order</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {banners.map((banner, index) => (
              <div key={banner.id} className="data-row">
                <span className="relative block h-14 overflow-hidden rounded-xl bg-ground">
                  <SafeImage
                    src={banner.image}
                    alt={`Slide ${index + 1}`}
                    sizes="200px"
                    className="object-cover"
                  />
                </span>
                <span className="truncate text-muted">
                  {banner.link ?? "Products page"}
                </span>
                <span>{banner.position}</span>
                <span>
                  <StatusPill
                    tone={banner.isActive ? "good" : "bad"}
                    label={banner.isActive ? "Live" : "Hidden"}
                  />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillForm(banner)}
                    className="btn-table"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisible(banner)}
                    disabled={busyId === banner.id}
                    className="btn-table"
                  >
                    {banner.isActive ? "Hide" : "Unhide"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(banner)}
                    disabled={busyId === banner.id}
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
