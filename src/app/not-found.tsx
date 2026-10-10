import Link from "next/link";

// 404 page.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center">
      <h1 className="text-[32px] font-extrabold">This page does not exist</h1>
      <Link href="/" className="btn-primary min-h-12 px-7">
        Back to home
      </Link>
    </div>
  );
}
