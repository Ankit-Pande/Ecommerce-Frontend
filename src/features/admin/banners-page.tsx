"use client";

import { useRef, useState } from "react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { useAdminData } from "@/features/admin/use-admin-data";
import {
  createBanner,
  deleteBanner,
  listBanners,
  setBannerActive,
} from "@/api/admin";
import { errorMessage } from "@/api/http";
import { safeHttpUrl } from "@/lib/sanitize";
import { toast } from "@/store/toast-store";
import type { AdminBanner } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Admin banners list and add form.
export default function AdminBanners() {
  const { data, setData, loading, failed, load } = useAdminData(listBanners);
  const banners = data ?? [];
  const [image, setImage] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [position, setPosition] = useState("0");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Saves a new banner.
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) {
      toast.error("Choose a banner image first");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("position", position || "0");
      if (link.trim()) form.append("link", link.trim());

      await createBanner(form);
      setImage(null);
      setLink("");
      setPosition("0");
      if (fileInput.current) fileInput.current.value = "";
      await load();
      toast.success("Banner published");
    } catch (error) {
      toast.error(errorMessage(error, "Could not publish this banner"));
    } finally {
      setSaving(false);
    }
  }

  // Hides or shows a banner on the home page.
  async function toggleActive(banner: AdminBanner) {
    setBusyId(banner.id);
    try {
      const { data: saved } = await setBannerActive(
        banner.id,
        !banner.isActive,
      );
      setData(
        (current) =>
          current?.map((item) => (item.id === saved.id ? saved : item)) ?? [],
      );
      toast.success(saved.isActive ? "Banner visible" : "Banner hidden");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this banner"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes a banner.
  async function remove(id: string) {
    if (!window.confirm("Delete this home banner?")) return;

    setBusyId(id);
    try {
      await deleteBanner(id);
      setData((current) => current?.filter((banner) => banner.id !== id) ?? []);
      toast.success("Banner deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this banner"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <form
        onSubmit={create}
        className="card flex flex-[1_1_280px] flex-col gap-3 p-5 xl:max-w-[380px]"
      >
        <h2 className="text-xl font-extrabold">Add banner</h2>
        <label className="flex flex-col gap-1.5 font-semibold">
          Banner image
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            required
            className="field py-2.5"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Opens (optional, full URL or /products?category=…)
          <input
            className="field"
            placeholder="/products?category=laptops"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Display order
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
          Add banner
        </Button>
      </form>

      <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
        <p className="text-muted">
          Home updates can take up to 10 minutes to appear.
        </p>
        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : banners.length === 0 ? (
          <p className="card p-8 text-center font-semibold">No banners yet</p>
        ) : (
          <div className="table-box">
            <div className="min-w-[820px]">
              <div className="table-head">
                <span>Banner</span>
                <span>Order</span>
                <span>Opens</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {banners.map((banner, index) => (
                <div key={banner.id} className="data-row">
                  <span className="relative block h-14 overflow-hidden rounded-xl bg-ground">
                    <SafeImage
                      src={banner.image}
                      alt={`Home banner ${index + 1}`}
                      sizes="200px"
                      className="object-cover"
                    />
                  </span>
                  <span>{banner.position}</span>
                  <span className="truncate text-muted">
                    {safeHttpUrl(banner.link) ?? "No link"}
                  </span>
                  <span>
                    <StatusPill
                      tone={banner.isActive ? "green" : "red"}
                      label={banner.isActive ? "Live" : "Hidden"}
                    />
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(banner)}
                      disabled={busyId === banner.id}
                      className="btn-table"
                    >
                      {banner.isActive ? "Hide" : "Unhide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(banner.id)}
                      disabled={busyId === banner.id}
                      className="btn-table text-danger"
                    >
                      Remove
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
