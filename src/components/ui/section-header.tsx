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
    <div className="mb-4 mt-9 flex items-end justify-between gap-4 sm:mb-5 sm:mt-12">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-accent sm:text-sm"
        >
          View all{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
