"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { safeHttpUrl } from "@/lib/sanitize";
import type { Banner, Category } from "@/lib/types";

const SLIDE_COLORS = ["#0B7A5C", "#1D3FA8", "#B4235A"];

// Title and line for a banner, read from the category or search in its link.
function bannerText(link: string, categories: Category[]) {
  const params = new URL(link, "http://local").searchParams;
  const slug = params.get("subcategory") ?? params.get("category");
  for (const category of categories) {
    if (category.slug === slug) {
      return {
        title: category.name,
        line: category.children
          .slice(0, 3)
          .map((child) => child.name)
          .join(", "),
      };
    }
    const child = category.children.find((entry) => entry.slug === slug);
    if (child) return { title: child.name, line: category.name };
  }
  const query = params.get("q");
  return query
    ? { title: query, line: "Search results" }
    : { title: "Today's offers", line: "" };
}

// Home banners, one at a time, with previous / next and dots.
export function BannerCarousel({
  banners,
  categories,
}: {
  banners: Banner[];
  categories: Category[];
}) {
  const [index, setIndex] = useState(0);
  if (banners.length === 0) return null;

  const banner = banners[index];
  const href = safeHttpUrl(banner.link) ?? "/products";
  const { title, line } = bannerText(href, categories);

  // Goes to the next or previous banner.
  function move(direction: -1 | 1) {
    setIndex(
      (current) => (current + direction + banners.length) % banners.length,
    );
  }

  return (
    <section
      aria-label="Offers"
      className="card flex flex-wrap gap-4 rounded-[28px] p-4"
    >
      <div
        className="flex flex-[1_1_300px] flex-col items-start justify-center gap-3 rounded-[20px] p-6 text-white sm:p-9"
        style={{ background: SLIDE_COLORS[index % SLIDE_COLORS.length] }}
      >
        <h1 className="text-[34px] font-extrabold leading-[1.08] sm:text-5xl">
          {title}
        </h1>
        {line && <p className="text-[19px]">{line}</p>}
        <Link
          href={href}
          className="inline-flex min-h-[50px] items-center rounded-xl bg-white px-[26px] text-[17px] font-extrabold text-ink"
        >
          Shop now
        </Link>
      </div>

      <div className="flex flex-[1_1_260px] flex-col items-center gap-3 rounded-[20px] bg-ground p-5">
        <span className="relative block h-[240px] w-full">
          <SafeImage
            src={banner.image}
            alt=""
            priority={index === 0}
            sizes="(max-width: 900px) 100vw, 800px"
            className="object-contain"
          />
        </span>
        {banners.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous banner"
              className="h-11 w-11 rounded-full bg-white text-xl"
            >
              ‹
            </button>
            {banners.map((entry, entryIndex) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setIndex(entryIndex)}
                aria-label={`Banner ${entryIndex + 1}`}
                aria-current={entryIndex === index}
                className={`h-2.5 rounded-full bg-ink ${entryIndex === index ? "w-8" : "w-2.5 opacity-35"}`}
              />
            ))}
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next banner"
              className="h-11 w-11 rounded-full bg-white text-xl"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
