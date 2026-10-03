import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeader } from "@/components/ui/section-header";
import { catalogHref } from "@/lib/catalog-fallback";
import type { Category } from "@/lib/types";

const MAX_CATEGORIES = 8;
const MAX_SUBCATEGORIES = 3;

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <section>
      <SectionHeader title="Shop by category" href="/products" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4 xl:grid-cols-8">
        {categories.slice(0, MAX_CATEGORIES).map((category) => (
          <article
            key={category.id}
            className="group overflow-hidden rounded-2xl border border-sand bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          >
            <Link href={catalogHref(category)} className="block">
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-mist to-white dark:from-white/[0.07] dark:to-white/[0.02]">
                <SafeImage
                  src={category.image}
                  alt={category.name}
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 160px"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
                <h2 className="truncate text-sm font-extrabold">
                  {category.name}
                </h2>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-accent" />
              </div>
            </Link>

            {category.children.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-sand px-3 py-2.5 dark:border-white/10">
                {category.children.slice(0, MAX_SUBCATEGORIES).map((child) => (
                  <Link
                    key={child.id}
                    href={catalogHref(child, "subcategory")}
                    className="max-w-full truncate rounded-full bg-mist px-2 py-1 text-[9px] font-bold text-gray-600 transition hover:bg-accent hover:text-white dark:bg-white/[0.07] dark:text-gray-300"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
