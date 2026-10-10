import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

// 404 page.
export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ground text-accent">
          <SearchX className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold">
          This page does not exist
        </h1>
        <Link href="/" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}
