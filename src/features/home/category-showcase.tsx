import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeader } from "@/components/ui/section-header";
import { catalogHref } from "@/lib/format";
import type { Category } from "@/lib/types";

// Category tiles on the home page.
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Shop our top categories" href="/products" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={catalogHref(category)}
            className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl p-3 transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-4 bg-mist dark:bg-white/[0.06]"
          >
            <h3 className="font-display text-xs font-extrabold leading-tight sm:text-sm">
              {category.name}
            </h3>
            <div className="relative mt-2 flex-1">
              <SafeImage
                src={category.image}
                alt=""
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px"
                className="rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold opacity-80 group-hover:opacity-100">
              Shop now <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
