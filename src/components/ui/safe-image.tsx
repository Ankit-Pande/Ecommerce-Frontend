"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

// next/image that shows a placeholder icon when the image is missing or fails to load.
export function SafeImage({
  src,
  alt,
  sizes,
  className = "object-contain",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    setFailed(Boolean(image?.complete && image.naturalWidth === 0));
  }, [src]);

  if (!src || failed) {
    return (
      <span className="absolute inset-0 grid place-items-center text-muted">
        <ImageIcon
          className="h-1/2 max-h-10 w-1/2 max-w-10"
          strokeWidth={1.25}
        />
      </span>
    );
  }

  return (
    <Image
      ref={imageRef}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
