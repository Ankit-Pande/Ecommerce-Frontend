import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { catalogHref, TINTS } from "@/lib/format";
import type { Category } from "@/lib/types";

// "Shop by category" tiles on the home page.
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[26px] font-extrabold">Shop by category</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3.5">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={catalogHref(category)}
            className="card flex flex-col items-center gap-2 p-3 text-center font-semibold"
          >
            <span
              className="block w-full rounded-[14px] p-2.5"
              style={{ background: TINTS[index % TINTS.length] }}
            >
              <span className="relative block h-[70px]">
                <SafeImage
                  src={category.image}
                  alt=""
                  sizes="130px"
                  className="object-contain"
                />
              </span>
            </span>
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
