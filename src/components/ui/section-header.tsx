import Link from "next/link";

// Section title with an optional "View all" link.
export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[26px] font-extrabold">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center px-2 font-extrabold text-accent"
        >
          View all ›
        </Link>
      )}
    </div>
  );
}
