import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminNav } from "@/features/admin/admin-nav";

export default function AdminHome() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {adminNav
        .filter((area) => area.href !== "/admin")
        .map((area) => {
          const Icon = area.icon;

          return (
            <Link
              key={area.href}
              href={area.href}
              className="group rounded-2xl border border-sand p-5 transition hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-card dark:border-white/10"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-sm font-extrabold">{area.label}</h2>
              <span className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-accent">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
    </div>
  );
}
