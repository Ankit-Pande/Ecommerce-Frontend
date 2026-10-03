"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";

const MAX_THUMBNAILS = 6;

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const visibleImages = images.slice(0, MAX_THUMBNAILS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const activeImage = visibleImages[activeIndex] ?? "";

  function move(direction: -1 | 1) {
    setActiveIndex(
      (index) =>
        (index + direction + visibleImages.length) % visibleImages.length,
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => activeImage && setPreviewOpen(true)}
        aria-label="Open full-size image"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-mist/60 dark:bg-white/[0.04]"
      >
        <SafeImage
          src={activeImage}
          alt={name}
          priority
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-contain p-6 sm:p-10"
        />
        {activeImage && (
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </span>
        )}
      </button>

      {visibleImages.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {visibleImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View product image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition dark:bg-white/[0.04] ${
                activeIndex === index
                  ? "border-accent shadow-sm"
                  : "border-transparent hover:border-accent/30"
              }`}
            >
              <SafeImage
                src={image}
                alt=""
                sizes="90px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}

      {previewOpen && (
        <ImagePreview
          image={activeImage}
          name={name}
          count={visibleImages.length}
          onMove={move}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

// Full-screen view: arrows or ←/→ to change image, Esc or ✕ to close.
function ImagePreview({
  image,
  name,
  count,
  onMove,
  onClose,
}: {
  image: string;
  name: string;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onMove(-1);
      if (event.key === "ArrowRight") onMove(1);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, onMove]);

  const arrowClass =
    "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg hover:bg-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} image`}
      className="fixed inset-0 z-[60] bg-black/90"
    >
      <div className="absolute inset-4 sm:inset-12">
        <SafeImage
          src={image}
          alt={name}
          sizes="100vw"
          className="object-contain"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink"
      >
        <X className="h-5 w-5" />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => onMove(-1)}
            aria-label="Previous image"
            className={`${arrowClass} left-4`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            aria-label="Next image"
            className={`${arrowClass} right-4`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
