"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { safeHttpUrl } from "@/lib/sanitize";
import type { Banner } from "@/lib/types";

const SLIDE_INTERVAL_MS = 3_000;

// Sliding home banners.
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % banners.length),
      SLIDE_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  // Goes to the next or previous banner.
  function move(direction: -1 | 1) {
    setIndex(
      (current) => (current + direction + banners.length) % banners.length,
    );
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Store offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative aspect-[16/7] overflow-hidden rounded-2xl bg-mist shadow-soft lg:aspect-auto lg:min-h-[340px]"
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, bannerIndex) => (
          <Link
            key={banner.id}
            href={safeHttpUrl(banner.link) ?? "/products"}
            className="relative h-full min-w-full"
            aria-label={`Open offer ${bannerIndex + 1}`}
          >
            <SafeImage
              src={banner.image}
              alt={`ApnaKart offer ${bannerIndex + 1}`}
              priority={bannerIndex === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous offer"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next offer"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2.5 py-2 backdrop-blur-sm">
            {banners.map((banner, bannerIndex) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Show offer ${bannerIndex + 1}`}
                aria-current={bannerIndex === index}
                onClick={() => setIndex(bannerIndex)}
                className={`h-1.5 rounded-full transition-all ${bannerIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
