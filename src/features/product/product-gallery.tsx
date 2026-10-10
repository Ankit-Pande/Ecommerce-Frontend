"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { tintFor, TINTS } from "@/lib/format";

const MAX_THUMBNAILS = 4;

// Main image on a tinted tile with up to four thumbnails.
export function ProductGallery({
  id,
  images,
  name,
}: {
  id: string;
  images: string[];
  name: string;
}) {
  const thumbnails = images.slice(0, MAX_THUMBNAILS);
  const [active, setActive] = useState(0);
  const tint = tintFor(id);

  return (
    <div className="card flex flex-[1_1_300px] flex-col gap-3 rounded-[28px] p-4">
      <div className="rounded-[20px] p-7" style={{ background: tint }}>
        <span className="relative block h-[300px]">
          <SafeImage
            src={thumbnails[active]}
            alt={name}
            priority
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-contain"
          />
        </span>
      </div>
      {thumbnails.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {thumbnails.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={active === index}
              className={`rounded-xl p-2.5 ${active === index ? "outline outline-2 outline-accent" : ""}`}
              style={{
                background: TINTS[(TINTS.indexOf(tint) + index) % TINTS.length],
              }}
            >
              <span className="relative block h-[52px]">
                <SafeImage
                  src={image}
                  alt=""
                  sizes="90px"
                  className="object-contain"
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
