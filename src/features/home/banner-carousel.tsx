"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { safeLink } from "@/lib/links";
import type { Banner, Category } from "@/lib/types";

const SLIDE_COLORS = ["#0B7A5C", "#1D3FA8", "#B4235A"];
const SLIDE_SECONDS = 4;

// Title and line for a slide, taken from the category its link opens.
function slideText(link: string, categories: Category[]) {
  const params = new URL(link, "http://localhost").searchParams;
  const slug = params.get("subcategory") ?? params.get("category");
  for (const category of categories) {
    if (category.slug === slug) {
      const names = category.children.slice(0, 3).map((child) => child.name);
      return { title: category.name, line: names.join(", ") };
    }
    const child = category.children.find((item) => item.slug === slug);
    if (child) return { title: child.name, line: category.name };
  }
  if (params.get("q")) return { title: params.get("q") ?? "", line: "" };
  if (params.get("section") === "trending")
    return { title: "Trending", line: "" };
  if (params.get("section") === "featured")
    return { title: "Featured", line: "" };
  if (params.get("discount") === "true")
    return { title: "Top discounts", line: "" };
  if (params.get("sort") === "latest")
    return { title: "New arrivals", line: "" };
  return { title: "Today's offers", line: "" };
}

// Home slides that move on by themselves, with previous/next buttons and dots.
export function BannerCarousel({
  banners,
  categories,
}: {
  banners: Banner[];
  categories: Category[];
}) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = setTimeout(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % count);
    }, SLIDE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [index, count]);

  if (count === 0) return null;

  return (
    <section
      aria-label="Offers"
      className="relative overflow-hidden rounded-[28px] shadow-[0_6px_20px_rgba(15,42,46,.12)]"
    >
      <div
        className="flex transition-transform duration-[600ms] ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, position) => {
          const href = safeLink(banner.link) ?? "/products";
          const { title, line } = slideText(href, categories);
          const hidden = position !== index;
          return (
            <div
              key={banner.id}
              aria-hidden={hidden}
              className="flex min-w-0 shrink-0 basis-full flex-wrap items-center justify-center gap-6 px-7 pb-[72px] pt-8 text-white"
              style={{
                background: SLIDE_COLORS[position % SLIDE_COLORS.length],
              }}
            >
              <div className="flex flex-[1_1_260px] flex-col items-start gap-3">
                <h2 className="text-[34px] font-extrabold leading-[1.08] sm:text-[44px]">
                  {title}
                </h2>
                {line && <p className="text-[19px]">{line}</p>}
                <Link
                  href={href}
                  tabIndex={hidden ? -1 : undefined}
                  className="inline-flex min-h-[50px] items-center rounded-full bg-sunny px-7 text-[17px] font-extrabold text-ink"
                >
                  Shop now
                </Link>
              </div>
              <div className="w-full max-w-[260px] flex-[0_1_260px] -rotate-3 rounded-[32px] bg-white p-5">
                <span className="relative block h-[200px]">
                  <SafeImage
                    src={banner.image}
                    alt=""
                    priority={position === 0}
                    sizes="260px"
                  />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-3.5 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setIndex((index - 1 + count) % count)}
            aria-label="Previous slide"
            className="h-11 w-11 rounded-full bg-white text-[22px]"
          >
            ‹
          </button>
          {banners.map((banner, position) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Slide ${position + 1}`}
              aria-current={position === index}
              className={`h-2.5 rounded-full bg-white transition-all ${position === index ? "w-8" : "w-2.5 opacity-50"}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setIndex((index + 1) % count)}
            aria-label="Next slide"
            className="h-11 w-11 rounded-full bg-white text-[22px]"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
