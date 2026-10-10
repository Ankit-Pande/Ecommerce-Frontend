"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

type SafeImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

// Image that falls back to an icon when the URL is missing or broken.
export function SafeImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    setFailed(Boolean(image?.complete && image.naturalWidth === 0));
  }, [src]);

  if (!src || failed) {
    return (
      <span className="absolute inset-0 grid place-items-center text-gray-300">
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
