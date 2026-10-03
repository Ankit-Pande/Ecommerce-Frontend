import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Section title with an optional "View all" link.
export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-4 mt-10 flex items-center justify-between gap-4 sm:mb-5 sm:mt-14">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 rounded-full border border-sand bg-white px-3.5 py-1.5 text-xs font-bold text-ink transition hover:border-accent hover:text-accent dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
