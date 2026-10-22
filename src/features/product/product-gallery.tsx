"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { tintAt } from "@/lib/colors";

// Big product image with thumbnails to switch it.
export function ProductGallery({
  images,
  name,
  tintIndex,
  discountPercent,
}: {
  images: string[];
  name: string;
  tintIndex: number;
  discountPercent: number;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
      <div
        className="relative rounded-[22px] p-6"
        style={{ background: tintAt(tintIndex + active) }}
      >
        <span className="relative block h-[260px] sm:h-[320px]">
          <SafeImage
            src={images[active]}
            alt={name}
            priority
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </span>
        {discountPercent > 0 && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-discount px-3.5 py-1 font-semibold text-white">
            {discountPercent}% off
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Image ${index + 1}`}
              aria-pressed={index === active}
              className={`rounded-[14px] border-[3px] p-2 ${index === active ? "border-accent" : "border-transparent"}`}
              style={{ background: tintAt(tintIndex + index) }}
            >
              <span className="relative block h-[52px]">
                <SafeImage src={image} alt="" sizes="96px" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
