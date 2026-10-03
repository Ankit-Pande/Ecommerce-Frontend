"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, ImageUp, Plus, Trash2 } from "lucide-react";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { SafeImage } from "@/components/ui/safe-image";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Spinner } from "@/components/ui/spinner";
import { useAdminData } from "@/features/admin/use-admin-data";
import { createBanner, deleteBanner, listBanners } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { safeHttpUrl } from "@/lib/sanitize";
import { toast } from "@/store/toast-store";
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
    <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form
        onSubmit={create}
        className="rounded-2xl border border-sand p-5 dark:border-white/10 xl:sticky xl:top-32"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Plus className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-extrabold">Publish banner</h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Banner image
            </span>
            <span className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 px-3 text-center text-xs font-bold text-gray-500 hover:border-accent/30 dark:border-white/20">
              <ImageUp className="h-5 w-5" />
              {image?.name ?? "Choose a wide image"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                required
                className="sr-only"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Link <span className="font-medium text-gray-400">(optional)</span>
            </span>
            <input
              className="field"
              type="url"
              placeholder="https://apnakart.in/products"
              value={link}
              onChange={(event) => setLink(event.target.value)}
            />
            <span className="mt-1.5 block text-[10px] leading-4 text-gray-400">
              Enter the full URL, including https://.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">
              Display order
            </span>
            <input
              className="field"
              inputMode="numeric"
              value={position}
              onChange={(event) =>
                setPosition(event.target.value.replace(/\D/g, ""))
              }
            />
          </label>

          <Button type="submit" loading={saving} className="w-full">
            Publish banner
          </Button>
        </div>
      </form>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-extrabold">Active home banners</h2>
          <p className="mt-1 text-xs text-gray-500">
            Home updates can take up to 10 minutes to appear.
          </p>
        </div>

        {loading ? (
          <ListSkeleton count={3} />
        ) : failed ? (
          <OfflineNotice onRetry={load} />
        ) : banners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center dark:border-white/15">
            <ImageIcon className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No active banners</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <article
                key={banner.id}
                className="overflow-hidden rounded-2xl border border-sand dark:border-white/10"
              >
                <div className="relative aspect-[16/5] bg-mist dark:bg-white/[0.04]">
                  <SafeImage
                    src={banner.image}
                    alt={`Home banner ${index + 1}`}
                    sizes="800px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="status-pill bg-accent/10 text-accent">
                    Live
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-500">
                    {safeHttpUrl(banner.link) ?? "No destination link"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(banner.id)}
                    disabled={busyId === banner.id}
                    className="icon-button text-gray-400 hover:text-deal"
                    aria-label="Delete banner"
                  >
                    {busyId === banner.id ? (
                      <Spinner />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
